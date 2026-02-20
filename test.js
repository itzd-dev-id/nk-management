const fs = require('fs');
const works = JSON.parse(fs.readFileSync('works.json', 'utf8'));

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectWorkFromKeyword(keyword, hierarchy, categoryFilter) {
    if (!keyword) return '';

    const normalizedInput = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');

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
                    task: task,
                    priority: task.length
                });
            }
        }
    }

    allTasks.sort((a, b) => b.priority - a.priority);

    const matches = [];
    const isExplicitPath = keyword.includes('/');
    const pathSegments = isExplicitPath ? keyword.split('/').map(s => s.trim().toLowerCase().replace(/_/g, ' ')) : [];

    for (const item of allTasks) {
        const catName = item.cat.toLowerCase().replace(/_/g, ' ');
        const groupName = item.group.toLowerCase().replace(/_/g, ' ');
        const taskName = item.task.toLowerCase().replace(/_/g, ' ');

        if (isExplicitPath) {
            const hasTaskMatch = pathSegments.some(seg => taskName.includes(seg) || seg.includes(taskName));
            const hasGroupMatch = pathSegments.some(seg => groupName.includes(seg) || seg.includes(groupName));
            const hasCatMatch = pathSegments.some(seg => catName.includes(seg) || seg.includes(catName));

            if (hasTaskMatch) {
                const pathScore = (hasGroupMatch ? 50 : 0) + (hasCatMatch ? 50 : 0);
                if (pathScore > 0) {
                    matches.push({ ...item, index: 0, contextScore: pathScore + 100 });
                }
            }
        }

        const idx = normalizedInput.indexOf(taskName);
        if (idx !== -1) {
            const catMatch = normalizedInput.includes(item.cat.toLowerCase()) ? 1 : 0;
            const groupMatch = normalizedInput.includes(item.group.toLowerCase()) ? 1 : 0;

            let posBonus = 0;
            if (groupMatch) {
                const groupIdx = normalizedInput.indexOf(item.group.toLowerCase());
                if (groupIdx < idx) {
                    posBonus = 50;
                } else if (groupIdx === 0) {
                    posBonus = 10;
                } else {
                    posBonus = 1 - (groupIdx / 10000);
                }
            }

            matches.push({ ...item, index: idx, contextScore: (catMatch * 10) + (groupMatch * 20) + posBonus });
        }
    }

    if (matches.length > 0) {
        matches.sort((a, b) => {
            if (Math.abs(b.contextScore - a.contextScore) > 0.0001) return b.contextScore - a.contextScore;
            if (a.index !== b.index) return a.index - b.index;
            return b.priority - a.priority;
        });

        console.log(`[Matches for ${keyword}] ->`, matches.slice(0, 3));
        return `${matches[0].cat} / ${matches[0].group} / ${matches[0].task}`;
    }

    return '';
}

console.log('Result 1:', detectWorkFromKeyword("kolom/bekisting", works));
console.log('Result 2:', detectWorkFromKeyword("kolom/bekisting, Rusun Guru A.1 001.jpeg", works));
console.log('Result 3:', detectWorkFromKeyword("Rusun Guru A.1 001.jpeg, kolom/bekisting", works));

