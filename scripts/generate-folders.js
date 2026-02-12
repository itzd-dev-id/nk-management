const fs = require('fs');
const path = require('path');

const buildings = JSON.parse(fs.readFileSync('./buildings.json', 'utf8'));
const works = JSON.parse(fs.readFileSync('./works.json', 'utf8'));

const baseDir = '/Users/odi/Desktop/Nindya Karya/Tools/nk-management/Termin';

if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

console.log(`Generating folders in: ${baseDir}`);

let totalCreated = 0;
works.forEach((categoryObj) => {
    const categoryName = categoryObj.category;
    const tasks = categoryObj.tasks;

    buildings.forEach((building) => {
        const buildingFolderName = `${categoryName} - ${building.name} (${building.code})`
            .replace(/[<>:"/\\|?*]/g, '');

        const buildingPath = path.join(baseDir, buildingFolderName);
        if (!fs.existsSync(buildingPath)) {
            fs.mkdirSync(buildingPath, { recursive: true });
        }

        tasks.forEach((task) => {
            const taskFolderName = task.replace(/[<>:"/\\|?*]/g, '');
            const taskPath = path.join(buildingPath, taskFolderName);
            if (!fs.existsSync(taskPath)) {
                fs.mkdirSync(taskPath);
                totalCreated++;
            }
        });
    });
});

console.log(`Complete! Total subfolders created: ${totalCreated}`);
