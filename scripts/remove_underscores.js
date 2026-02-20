const fs = require('fs');

function main() {
    const data = JSON.parse(fs.readFileSync('works.json', 'utf8'));
    let changes = 0;

    data.forEach(cat => {
        cat.groups.forEach(group => {
            let newTasks = [];
            group.tasks.forEach(task => {
                let newTask = task;

                // Remove underscores and replace with space
                if (newTask.includes('_')) {
                    newTask = newTask.replace(/_/g, ' ').trim();
                }

                if (newTask !== task) {
                    console.log(`[UPDATE] ${group.name} | "${task}" -> "${newTask}"`);
                    changes++;
                }
                newTasks.push(newTask);
            });

            // Remove duplicates
            group.tasks = [...new Set(newTasks)];
            // Sort alphabetically
            group.tasks.sort((a, b) => a.localeCompare(b));
        });
    });

    console.log(`Total underscore removals: ${changes}`);
    fs.writeFileSync('works.json', JSON.stringify(data, null, 2));
}

main();
