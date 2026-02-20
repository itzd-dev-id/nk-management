const fs = require('fs');

const works = JSON.parse(fs.readFileSync('works_dump.json', 'utf8'))[0].value;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectWorkFromKeyword(keyword, hierarchy, categoryFilter) {
    if (!keyword) return '';

    // Clean up input: remove exact matches of common ignored words first
    let cleanInput = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');

    // Alias mapping
    const aliases = {
        'plat': 'pelat',
        'plafond': 'plafon',
        'ac': 'hvac',
    };
    for (const [alias, realName] of Object.entries(aliases)) {
        cleanInput = cleanInput.replace(new RegExp(`\\b${alias}\\b`, 'gi'), realName);
    }

    const rawTokens = cleanInput.split(/[,;\/\s]+/).filter(Boolean);

    const ignoredTokens = new Set(['work', 'name', 'select', 'building', 'date']);
    const tokens = rawTokens.filter(t => t.length >= 2 && !ignoredTokens.has(t));

    if (tokens.length === 0) return '';

    const filteredHierarchy = categoryFilter
        ? hierarchy.filter(h => h.category.toLowerCase() === categoryFilter.toLowerCase())
        : hierarchy;

    const allTasks = [];
    for (const cat of filteredHierarchy) {
        for (const group of cat.groups) {
            for (const task of group.tasks) {
                allTasks.push({
                    cat: cat.category,
                    group: group.name,
                    task: task
                });
            }
        }
    }

    for (const item of allTasks) {
        let score = 0;
        let matchedTokens = 0;
        let explicitPathMatch = false;

        const catTokens = item.cat.toLowerCase().split(/[\s\/]+/).filter(Boolean);
        const groupTokens = item.group.toLowerCase().split(/[\s\/]+/).filter(Boolean);
        const taskTokens = item.task.toLowerCase().split(/[\s\/]+/).filter(Boolean);

        const catStr = item.cat.toLowerCase();
        const groupStr = item.group.toLowerCase();
        const taskStr = item.task.toLowerCase();

        // 1. Explicit Path Check (Massive Bonus)
        // If string contains explicit "group/task" or "category/group/task"
        if (keyword.includes('/')) {
            const segments = keyword.split('/').map(s => s.trim().toLowerCase());
            for (let i = 0; i < segments.length - 1; i++) {
                const parent = aliases[segments[i]] || segments[i];
                const child = aliases[segments[i + 1]] || segments[i + 1];

                if (groupStr.includes(parent) && taskStr.includes(child)) {
                    score += 500;
                    explicitPathMatch = true;
                }
                if (catStr.includes(parent) && groupStr.includes(child)) {
                    score += 500;
                    explicitPathMatch = true;
                }
            }
        }

        // 2. Exact Substring Match Bonus
        if (cleanInput.includes(taskStr)) score += 50;
        if (cleanInput.includes(groupStr)) score += 30;
        if (cleanInput.includes(catStr)) score += 10;

        // 3. Token Match Bonus
        for (const token of tokens) {
            let tokenMatched = false;

            // Task matches are worth the most
            if (taskTokens.some(t => t === token || t.includes(token))) {
                score += 20;
                tokenMatched = true;
            }
            // Group matches
            else if (groupTokens.some(t => t === token || t.includes(token))) {
                score += 15;
                tokenMatched = true;
            }
            // Category matches
            else if (catTokens.some(t => t === token || t.includes(token))) {
                score += 5;
                tokenMatched = true;
            }

            if (tokenMatched) matchedTokens++;
        }

        item.score = score;
        item.matchedTokens = matchedTokens;
        item.explicitPathMatch = explicitPathMatch;
    }

    // Sort by:
    // 1. Did it match an explicit path?
    // 2. Highest Score
    // 3. Most Tokens Matched
    // 4. Shortest Task Name (If "Bekisting Kolom" and "Bekisting" both match "bekisting" with equal score, choose the more specific exact match if possible, or shorter if we want the exact word)
    // Actually, shorter task name is better if both match the same tokens. Because "Bekisting" matches "bekisting" 100%.
    allTasks.sort((a, b) => {
        if (b.explicitPathMatch !== a.explicitPathMatch) return b.explicitPathMatch ? 1 : -1;
        if (b.score !== a.score) return b.score - a.score;
        if (b.matchedTokens !== a.matchedTokens) return b.matchedTokens - a.matchedTokens;
        return a.task.length - b.task.length;
    });

    const topMatches = allTasks.filter(t => t.score > 0);

    // Debug
    // console.log(`\nInput: "${keyword}"`);
    // topMatches.slice(0, 3).forEach(m => {
    //     console.log(`  [Score: ${m.score}, Tokens: ${m.matchedTokens}, Explicit: ${m.explicitPathMatch}] ${m.cat} / ${m.group} / ${m.task}`);
    // });

    if (topMatches.length > 0) {
        return `${topMatches[0].cat} / ${topMatches[0].group} / ${topMatches[0].task}`;
    }

    return '';
}

// Tests
console.log("1.", detectWorkFromKeyword("kolom/bekisting", works));
console.log("2.", detectWorkFromKeyword("Rusun Guru A.1 001.jpeg, kolom/bekisting", works));
console.log("3.", detectWorkFromKeyword("Rusun Guru A 001.jpeg, kolom bekisting", works));
console.log("4.", detectWorkFromKeyword("bekisting plat lantai", works));
console.log("5.", detectWorkFromKeyword("galian tanah", works));
console.log("6.", detectWorkFromKeyword("Struktur_Balok_Besi_Tulangan_Ulir_Rusun_Guru_A_001.jpeg", works));
console.log("7.", detectWorkFromKeyword("pengecoran tie beam", works));

