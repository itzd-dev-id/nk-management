const fs = require('fs');
const works = JSON.parse(fs.readFileSync('works_dump.json', 'utf8'))[0].value;

function detectWorkFromKeyword(keyword, hierarchy, categoryFilter) {
    if (!keyword) return '';

    // Split by comma. The LAST part is the user's manual input usually if they typed something new,
    // OR we should treat comma-separated parts as separate query attempts, prioritizing the LAST one.
    const phrases = keyword.split(',').map(s => s.trim()).filter(Boolean);

    const aliases = {
        'plat': 'pelat',
        'plafond': 'plafon',
        'ac': 'hvac',
    };

    const allTasks = [];
    for (const cat of hierarchy) {
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

    // We score tasks against each phrase independently.
    // The LAST phrase (index: phrases.length - 1) gets a massive priority bonus because it represents user input.
    let bestMatch = null;
    let maxScore = 0;

    for (let pIndex = 0; pIndex < phrases.length; pIndex++) {
        let cleanPhrase = phrases[pIndex].toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');
        for (const [alias, realName] of Object.entries(aliases)) {
            cleanPhrase = cleanPhrase.replace(new RegExp(`\\b${alias}\\b`, 'gi'), realName);
        }

        const tokens = cleanPhrase.split(/[\s\/]+/).filter(t => t.length > 2 && !['work', 'name', 'select', 'building', 'date', 'jpeg', 'jpg', 'png'].includes(t));
        if (tokens.length === 0) continue;

        const isLastPhrase = (pIndex === phrases.length - 1);

        for (const item of allTasks) {
            let score = 0;

            const catStr = item.cat.toLowerCase();
            const groupStr = item.group.toLowerCase();
            const taskStr = item.task.toLowerCase();

            // Explicit path logic
            if (phrases[pIndex].includes('/')) {
                const parts = phrases[pIndex].split('/').map(s => s.trim().toLowerCase());
                if (parts.length >= 2) {
                    const parent = aliases[parts[parts.length - 2]] || parts[parts.length - 2];
                    const child = aliases[parts[parts.length - 1]] || parts[parts.length - 1];

                    if ((groupStr === parent || groupStr.includes(parent)) && (taskStr === child || taskStr.includes(child))) {
                        score += 1000;
                    }
                }
            }

            // Exact Token Matches
            const catTokens = catStr.split(/[\s\/]+/).filter(Boolean);
            const groupTokens = groupStr.split(/[\s\/]+/).filter(Boolean);
            const taskTokens = taskStr.split(/[\s\/]+/).filter(Boolean);

            for (const token of tokens) {
                if (taskTokens.some(t => t === token)) score += 30;
                else if (taskTokens.some(t => t.includes(token))) score += 15;

                if (groupTokens.some(t => t === token)) score += 20;
                else if (groupTokens.some(t => t.includes(token))) score += 10;

                if (catTokens.some(t => t === token)) score += 5;
            }

            // Implicit Grouping
            const groupIdx = cleanPhrase.indexOf(groupStr);
            const taskIdx = cleanPhrase.indexOf(taskStr);
            if (groupIdx !== -1 && taskIdx !== -1 && groupIdx < taskIdx) {
                score += 500;
            }

            // Exact phrase match
            if (cleanPhrase === taskStr) score += 200;
            if (cleanPhrase === groupStr) score += 100;

            if (score > 0) {
                // If this is the last phrase (manual user input), multiply its score by 10000 
                // so it strictly overrides any matches from the filename parsing.
                if (isLastPhrase && phrases.length > 1) {
                    score += 10000;
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = item;
                } else if (score === maxScore && bestMatch) {
                    if (item.task.length < bestMatch.task.length) {
                        bestMatch = item;
                    }
                }
            }
        }
    }

    if (bestMatch) {
        return `${bestMatch.cat} / ${bestMatch.group} / ${bestMatch.task}`;
    }

    return '';
}

console.log("1.", detectWorkFromKeyword("Struktur_Tie_Beam_Besi_Tulangan_Ulir_Rusun_Guru_A.1_001.jpeg, kolom/bekisting", works));
console.log("2.", detectWorkFromKeyword("Struktur_Tie_Beam_Besi_Tulangan_Ulir_Rusun_Guru_A.1_001.jpeg, kolom bekisting", works));
console.log("3.", detectWorkFromKeyword("bekisting plat", works));
console.log("4.", detectWorkFromKeyword("Struktur_Tie_Beam_Besi_Tulangan_Ulir_Rusun_Guru_A.1_001.jpeg, bekisting", works));
console.log("5.", detectWorkFromKeyword("Struktur_Tie_Beam_Besi_Tulangan_Ulir_Rusun_Guru_A.1_001.jpeg", works)); 
