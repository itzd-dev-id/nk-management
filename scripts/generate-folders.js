const fs = require('fs');
const path = require('path');

const buildings = JSON.parse(fs.readFileSync('./buildings.json', 'utf8'));
const works = JSON.parse(fs.readFileSync('./works.json', 'utf8'));

const baseDir = path.join(__dirname, '../Termin');

if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

console.log('Generating Termin folder structure...');

works.forEach((categoryObj) => {
    const categoryName = categoryObj.category;
    const tasks = categoryObj.tasks;

    buildings.forEach((building) => {
        // Folder name: Category - Building Name (Code)
        // We include code because some buildings have identical names (e.g. Rusun Guru)
        const buildingFolderName = `${categoryName} - ${building.name} (${building.code})`
            .replace(/[<>:"/\\|?*]/g, ''); // Sanitize for filesystem

        const buildingPath = path.join(baseDir, buildingFolderName);

        if (!fs.existsSync(buildingPath)) {
            fs.mkdirSync(buildingPath, { recursive: true });
        }

        tasks.forEach((task) => {
            const taskFolderName = task.replace(/[<>:"/\\|?*]/g, ''); // Sanitize
            const taskPath = path.join(buildingPath, taskFolderName);

            if (!fs.existsSync(taskPath)) {
                fs.mkdirSync(taskPath);
            }
        });
    });
});

console.log('Complete! Folders created in ./Termin');
