const fs = require('fs');

const buildings = JSON.parse(fs.readFileSync('buildings_dump.json', 'utf8'))[0].value;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectBuildingFromKeyword(keyword, buildings) {
    if (!keyword) return null;

    const rawParts = keyword.split(/[,;\/]/).map(p => p.trim()).filter(Boolean);
    if (rawParts.length === 0) return null;

    for (const part of rawParts) {
        const badgeMatch = part.match(/^\[(.*?)\]\s*(.*)$/i);
        if (badgeMatch) {
            const codePart = badgeMatch[1].toLowerCase().trim();
            const b = buildings.find(b => b.code.toLowerCase() === codePart);
            if (b) return b;
        }
    }

    const allTokens = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ').split(/[,;\s\/]+/).filter(Boolean);

    // PASS 1: Exact Code Match
    for (const token of allTokens) {
        const b = buildings.find(b => b.code.toLowerCase() === token);
        if (b) {
            console.log("Matched PASS 1:", b.code);
            return b;
        }
    }

    // PASS 2: Exact Name Match
    for (const part of rawParts) {
        const normalizedPart = part.toLowerCase().replace(/_/g, ' ').trim();
        const b = buildings.find(b => b.name.toLowerCase() === normalizedPart);
        if (b) {
            console.log("Matched PASS 2:", b.code);
            return b;
        }
    }

    // PASS 3: Partial Name Match (Word Boundary)
    for (const token of allTokens) {
        if (token.length <= 2) continue;
        const escapedTerm = escapeRegExp(token);
        const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
        const b = buildings.find(b => regex.test(b.name));
        if (b) {
            console.log("Matched PASS 3:", b.code);
            return b;
        }
    }

    return null;
}

console.log("1.", detectBuildingFromKeyword("rusun guru a", buildings));
console.log("2.", detectBuildingFromKeyword("rusun guru a.1", buildings));
console.log("3.", detectBuildingFromKeyword("Struktur_Tie_Beam_Besi_Tulangan_Ulir_Rusun_Guru_A.1_001.jpeg", buildings));
console.log("4.", detectBuildingFromKeyword("rusun guru a, kolom/bekisting", buildings));
