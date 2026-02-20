const fs = require('fs');

const works = JSON.parse(fs.readFileSync('works_dump.json', 'utf8'))[0].value;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectWorkFromKeyword(keyword, hierarchy, categoryFilter) {
    if (!keyword) return '';

    // Clean up input: remove exact matches of common ignored words first to avoid false token matches
    let cleanInput = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');
    // Remove known separators
    const rawTokens = cleanInput.split(/[,;\/\s]+/).filter(Boolean);

    // Tokens to ignore (e.g. from generated filenames or placeholder values)
    const ignoredTokens = new Set(['work', 'name', 'select', 'building', 'date']);
    const tokens = rawTokens.filter(t => t.length > 2 && !ignoredTokens.has(t));

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

    // SCORING ALGORITHM
    for (const item of allTasks) {
        let score = 0;
        let matchedTokens = 0;

        const catTokens = item.cat.toLowerCase().split(/[\s\/]+/).filter(Boolean);
        const groupTokens = item.group.toLowerCase().split(/[\s\/]+/).filter(Boolean);
        const taskTokens = item.task.toLowerCase().split(/[\s\/]+/).filter(Boolean);

        const allItemTokens = new Set([...catTokens, ...groupTokens, ...taskTokens]);

        // Exact Phrase Bonus
        const catStr = item.cat.toLowerCase();
        const groupStr = item.group.toLowerCase();
        const taskStr = item.task.toLowerCase();

        if (cleanInput.includes(taskStr)) score += 50;
        if (cleanInput.includes(groupStr)) score += 30;
        if (cleanInput.includes(catStr)) score += 10;

        // Explicit Hierarchy Bonus (e.g. group/task)
        if (keyword.includes('/')) {
            const segments = keyword.split('/').map(s => s.trim().toLowerCase());
            for (let i = 0; i < segments.length - 1; i++) {
                const parent = segments[i];
                const child = segments[i + 1];
                if ((parent === groupStr || parent === catStr) && (child === taskStr || child === groupStr)) {
                    score += 100; // Found exact explicit path
                }
            }
        }

        // Token Matching
        for (const token of tokens) {
            let tokenMatched = false;
            // Task matching gets highest token points
            if (taskTokens.some(t => t.includes(token) || token.includes(t))) {
                score += 10;
                tokenMatched = true;
            }
            // Group matching 
            else if (groupTokens.some(t => t.includes(token) || token.includes(t))) {
                score += 8;
                tokenMatched = true;
            }
            // Category matching
            else if (catTokens.some(t => t.includes(token) || token.includes(t))) {
                score += 5;
                tokenMatched = true;
            }

            if (tokenMatched) matchedTokens++;
        }

        item.score = score;
        item.matchedTokens = matchedTokens;
    }

    // Sort by score first, then by number of matched tokens, then by specificity (task length)
    allTasks.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.matchedTokens !== a.matchedTokens) return b.matchedTokens - a.matchedTokens;
        return b.task.length - a.task.length;
    });

    const topMatches = allTasks.filter(t => t.score > 0);

    // Debug
    // console.log(`\nInput: "${keyword}"`);
    // topMatches.slice(0, 3).forEach(m => {
    //     console.log(`  [Score: ${m.score}, Tokens: ${m.matchedTokens}] ${m.cat} / ${m.group} / ${m.task}`);
    // });

    if (topMatches.length > 0) {
        return `${topMatches[0].cat} / ${topMatches[0].group} / ${topMatches[0].task}`;
    }

    return '';
}

// Tests
console.log("1.", detectWorkFromKeyword("kolom/bekisting", works) === "Struktur / Kolom / Bekisting" ? "PASS" : "FAIL");
console.log("2.", detectWorkFromKeyword("Rusun Guru A 001.jpeg, kolom bekisting", works) === "Struktur / Kolom / Bekisting" ? "PASS" : "FAIL");
console.log("3.", detectWorkFromKeyword("bekisting plat lantai", works) === "Struktur / Pelat / Bekisting" ? "PASS" : "FAIL"); // Plat matches Pelat alias if we had it, but works_dump already has Pelat
console.log("4.", detectWorkFromKeyword("galian tanah", works) === "Struktur / Tanah / Galian" ? "PASS" : "FAIL");
console.log("5.", detectWorkFromKeyword("Struktur_Tie_Beam_Besi_Tulangan_Ulir_Rusun_Guru_A_001.jpeg", works) === "Struktur / Tie Beam / Besi Tulangan Ulir" ? "PASS" : "FAIL");
console.log("6.", detectWorkFromKeyword("pengecoran", works) === "Struktur / Tie Beam / Pengecoran" ? "PASS" : "FAIL"); // Ambiguous, defaults to first?
