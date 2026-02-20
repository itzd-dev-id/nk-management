const fs = require('fs');
const works = JSON.parse(fs.readFileSync('works_dump.json', 'utf8'))[0].value;

function detectWorkFromKeyword(keyword, hierarchy, categoryFilter) {
    if (!keyword) return '';

    // Split by comma. The LAST part is the user's manual input usually if they typed something new,
    // OR we should treat comma-separated parts as separate query attempts, picking the one that scores highest.
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

    let bestMatch = null;
    let maxScore = 0;

    // We score ALL tasks against EACH phrase independently. The highest score wins.
    // This prevents a long filename full of words ("Struktur_Tie_Beam_Besi...") from combining scores with a short input ("kolom").
    // The short input "kolom/bekisting" will score extremely high on its own.
    
    for (let phrase of phrases) {
        let cleanPhrase = phrase.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');
        for (const [alias, realName] of Object.entries(aliases)) {
            cleanPhrase = cleanPhrase.replace(new RegExp(`\\b${alias}\\b`, 'gi'), realName);
        }

        const tokens = cleanPhrase.split(/[\s\/]+/).filter(t => t.length > 2 && !['work', 'name', 'select', 'building', 'date', 'jpeg', 'jpg', 'png'].includes(t));
        if (tokens.length === 0) continue;

        for (const item of allTasks) {
            let score = 0;
            let explicitMatch = false;

            const catStr = item.cat.toLowerCase();
            const groupStr = item.group.toLowerCase();
            const taskStr = item.task.toLowerCase();

            // Explicit path logic
            if (phrase.includes('/')) {
                const parts = phrase.split('/').map(s => s.trim().toLowerCase());
                if (parts.length >= 2) {
                    const parent = aliases[parts[parts.length-2]] || parts[parts.length-2];
                    const child = aliases[parts[parts.length-1]] || parts[parts.length-1];

                    // If user typed "kolom/bekisting"
                    if ((groupStr === parent || groupStr.includes(parent)) && (taskStr === child || taskStr.includes(child))) {
                        score += 1000;
                        explicitMatch = true;
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

            // Bonus for group word coming before task word (Implicit Grouping)
            // e.g. "kolom bekisting" -> group "kolom" is before "bekisting"
            // We check the phrase index!
            const groupIdx = cleanPhrase.indexOf(groupStr);
            const taskIdx = cleanPhrase.indexOf(taskStr);
            if (groupIdx !== -1 && taskIdx !== -1 && groupIdx < taskIdx) {
                score += 500;
            }

            // Additional bonus if the phrase exactly equals the group or task
            if (cleanPhrase === taskStr) score += 200;
            if (cleanPhrase === groupStr) score += 100;

            if (score > maxScore) {
                maxScore = score;
                bestMatch = item;
            } else if (score === maxScore && score > 0 && bestMatch) {
                // Tie breaker: shorter task length is better (more specific exact match)
                if (item.task.length < bestMatch.task.length) {
                    bestMatch = item;
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
// ^ If they just typed "bekisting", it might match Tie Beam / Bekisting because of "Tie Beam" in the filename.
// BUT wait, each phrase is evaluated INDEPENDENTLY!
// Phrase 1: "Struktur_Tie_Beam...jpeg" scores: Tie beam (+20 + 20) + Besi Tulangan Ulir (+30 + 30) = lots of points to Tie Beam / Besi.
// Phrase 2: "bekisting" scores: Task Bekisting (+30). Max score wins. If phrase 1 scores 100 and phrase 2 scores 30, it ignores phrase 2!
// This means the filename STILL WINS if it has more valid words! 
// Let's add a penalty for long filenames or a bonus for the LAST phrase (user input).
