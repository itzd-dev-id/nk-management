
const works = [
    {
        "category": "Structure",
        "groups": [
            {
                "name": "Tie Beam",
                "tasks": [
                    "Galian",
                    "Tie Beam",
                    "Lantai Kerja",
                    "Bekisting",
                    "Pembesian",
                    "Pengecoran",
                    "Pengecoran Tie Beam"
                ]
            },
            {
                "name": "Balok",
                "tasks": [
                    "Bekisting",
                    "Bekisting Balok",
                    "Pembesian",
                    "Pembesian Balok",
                    "Pengecoran",
                    "Pengecoran Balok",
                    "Pengecoran Balok Praktis",
                    "Balok Praktis"
                ]
            }
        ]
    }
];

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function detectWorkFromKeyword(keyword, hierarchy) {
    if (!keyword) return '';

    const normalizedInput = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');
    console.log("Normalized:", normalizedInput);

    const allTasks = [];

    for (const cat of hierarchy) {
        for (const group of cat.groups) {
            for (const task of group.tasks) {
                allTasks.push({
                    cat: cat.category,
                    group: group.name,
                    task: task,
                    priority: task.length
                });
            }
        }
    }

    // Sort by length for old priority logic (still useful for internal priority)
    allTasks.sort((a, b) => b.priority - a.priority);

    const matches = [];

    // PASS 1: Exact Match (Collect ALL matches)
    for (const item of allTasks) {
        const taskName = item.task.toLowerCase().replace(/_/g, ' ');
        const idx = normalizedInput.indexOf(taskName);
        if (idx !== -1) {
            matches.push({ ...item, index: idx });
            console.log(`PASS 1 Candidates: "${item.task}" at index ${idx}`);
        }
    }

    if (matches.length > 0) {
        // Sort matches: Earlier index first, then longer length
        matches.sort((a, b) => {
            if (a.index !== b.index) return a.index - b.index;
            return b.priority - a.priority;
        });

        console.log("PASS 1 Winner:", matches[0].task);
        return `${matches[0].cat} / ${matches[0].group} / ${matches[0].task}`;
    }

    // PASS 2: Tokens
    const tokens = normalizedInput.split(/[,;\s]+/).filter(t => t.length > 2 && !['work', 'name', 'select', 'building', 'date'].includes(t));
    console.log("Tokens:", tokens);

    for (const token of tokens) {
        const escapedToken = escapeRegExp(token);
        const regex = new RegExp(`\\b${escapedToken}\\b`, 'i');

        for (const item of allTasks) {
            if (regex.test(item.task.toLowerCase())) {
                console.log("PASS 2 Task Match:", item.task);
                return `${item.cat} / ${item.group} / ${item.task}`;
            }
        }

        // Group check
        for (const cat of hierarchy) {
            for (const group of cat.groups) {
                if (regex.test(group.name.toLowerCase())) {
                    console.log("PASS 2 Group Match:", group.name);
                    return `${cat.category} / ${group.name} / ${group.tasks[0] || ''}`;
                }
            }
        }
    }

    return '';
}

// Test Case
const filename = "Struktur_Balok_Pembesian_Asrama_Putra_SMP_D.1_0%_001.JPG";
const tags = ["Tie Beam"];
const slotKeywords = [...tags, filename.split('.')[0]];
const fullKeyword = slotKeywords.join(', ');

console.log("Full Keyword:", fullKeyword);
const result = detectWorkFromKeyword(fullKeyword, works);
console.log("FINAL RESULT:", result);
