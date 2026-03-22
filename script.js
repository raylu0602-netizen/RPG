let player = {
    hp: 100, maxHp: 100, coin: 0, level: 1, exp: 0, nextLevelExp: 100,
    atkRange: [5, 12],
    
    // --- 技能相關 ---
    skills: { fireballCD: 0, lightningCD: 0, healCD: 0 ,holyLightCD: 0, windWalkCD: 0,blackHoleCD: 0},
    unlockedSkills: { fireball: true, lightning: false, heal: false ,windWalk: false, holyLight: false, blackHole: false }, 
    skillLevels: { fireball: 1, lightning: 1, heal: 1 ,windWalk: 1, holyLight: 1, blackHole: 1}, 
    windWalkActive: false,
    bossDefeatedLevel: 0,
    protectionAmulet: 0, 
    expAmulet: 0,
    goldAmulet: 0,
    inventory: [], 
    equiptment: {
        weapon: null, 
        armor: null   
    },
    baseAtk: [5, 12],
    extraATK: 0, 
    baseDef: 0,
    extraDEF: 0,
    baseMaxHp: 100,
    currentArea: 0,
    rebirthCount: 0,
    towerFloor: 1,
    maxTowerFloor: 1,
    stats: { kills: 0, maxDamage: 0, totalGold: 0 },
    enhanceStones: 0
};

// --- 🗺️ 世界地圖與怪物設定 ---
const areas = [
    {
        id: 0,
        name: "幽暗森林",
        reqLevel: 1, // 進入需求等級
        monsters: [
            { name: "綠色史萊姆", hp: 20, maxHp: 20, image: "images/slime.png", atk: [3, 6], def: 1,exp: 25, coin: 50 },
            { name: "森林哥布林", hp: 40, maxHp: 40, image: "images/goblin.jpg", atk: [6, 12], def: 2,exp: 40, coin: 100 },
            { name: "地獄小惡魔", hp: 60, maxHp: 60, image: "images/imp.png", atk: [12, 18], def: 5,exp: 65, coin: 150 }
        ],
        boss: {
            name: "深淵魔龍", hp: 160, maxHp: 160, image: "images/boss.jpg", atk: [15, 25], def: 10,exp: 250, coin: 600, isBoss: true 
        }
    },
    {
        id: 1,
        name: "烈焰火山",
        reqLevel: 10, // 🌟 10 級才能解鎖！
        monsters: [
            { name: "熔岩犬", hp: 120, maxHp: 120, image: "images/hound.png", atk: [20, 35], def: 5,exp: 100, coin: 150 },
            { name: "火焰精靈", hp: 60, maxHp: 60, image: "images/fire_spirit.png", atk: [30, 45], def: 0,exp: 140, coin: 75 },
            { name: "火山岩怪", hp: 180, maxHp: 180, image: "images/golem.png", atk: [15, 25], def: 10,exp: 160, coin: 225 }
        ],
        boss: {
            name: "灰燼鳳凰", hp: 400, maxHp: 400, image: "images/fire_boss.png", atk: [40, 60], def: 20,exp: 400, coin: 900, isBoss: true 
        }
    }
];

let currentMonster = null;

// --- 穩定音效設定 ---
const sounds = {
    attack: new Audio("https://raw.githubusercontent.com/sh412/simple-rpg-assets/main/attack.mp3"),
    kill: new Audio("https://raw.githubusercontent.com/sh412/simple-rpg-assets/main/win.mp3"),
    fireball: new Audio("https://raw.githubusercontent.com/sh412/simple-rpg-assets/main/fireball.mp3")
};

Object.keys(sounds).forEach(key => {
    sounds[key].load();
    sounds[key].onerror = () => console.log(`🔊 音效 ${key} 載入失敗，請確認網路或連結。`);
});

// --- 核心功能 ---
function buyItem(item) {
    if (item === 'potion') {
        if (player.coin >= 20) {
            player.coin -= 20;
            player.hp = Math.min(player.hp + 30, player.maxHp);
            addLog("🥤 喝下了紅色藥水，回復了 30 點 HP！");
        } else {
            addLog("❌ 金幣不足！");
        }
    } 
    else if (item === 'sword') {
        let currentCost = 100 + (player.extraATK * 10); 
        if (player.coin >= currentCost) {
            player.coin -= currentCost;
            player.extraATK += 5; 
            addLog(`⚔️ 鐵匠為你強化了武器！攻擊力永久提升！ (花費 ${currentCost} 金幣)`);
        } else {
            addLog(`❌ 金幣不足！鐵匠說這次強化需要 ${currentCost} 金幣。`);
        }
    }
    else if (item === 'lightning_book') {
        if (player.coin >= 150) {
            player.coin -= 150;
            player.unlockedSkills.lightning = true;
            addLog("📘 <b style='color:#9b59b6;'>你翻開了古老的技能書，學會了新技能：【⚡ 閃電斬】！</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    } 
    else if (item === 'heal_book') {
        if (player.coin >= 200) {
            player.coin -= 200;
            player.unlockedSkills.heal = true;
            addLog("📗 <b style='color:#2ecc71;'>你感受到了大自然的魔力，學會了新技能：【🌿 治癒術】！</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    }
    else if (item === 'holyLight_book') {
        if (player.coin >= 1000000) {
            player.coin -= 1000000;
            player.unlockedSkills.holyLight = true;
            addLog("✨ <b style='color:#f1c40f;'>你領悟了宇宙的真理，解鎖了轉生神技：【✨ 聖光】！</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    }
    else if (item === 'amulet') {
        if (player.coin >= 300) {
            player.coin -= 300;
            player.protectionAmulet++;
            addLog("📿 <b style='color:#f1c40f;'>你購買了守護十字架！下次死亡時將自動消耗並免除懲罰。</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    }
    else if (item === 'exp_amulet') {
        let cost = 200 + (player.expAmulet * 100);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.expAmulet += 1; 
            let currentBonus = Math.floor(1000000*(player.expAmulet / (player.expAmulet + 1000)))/1000;
            addLog(`✨ 你購買了經驗護符！現在打怪會額外獲得 <b style="color:#f1c40f;">${currentBonus}%</b> 經驗值！`);
        } else {
            addLog(`❌ 金幣不足！購買經驗護符需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'gold_amulet') {
        let cost = 200 + (player.goldAmulet * 150);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.goldAmulet += 1; 
            let currentBonus = player.goldAmulet * 5;
            addLog(`🪙 你購買了金幣護符！現在獲得的金幣會額外增加 <b style="color:#f1c40f;">${currentBonus}%</b>！`);
        } else {
            addLog(`❌ 金幣不足！購買金幣護符需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'upgrade_fireball') {
        let cost = 150 + (player.skillLevels.fireball * 100);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.fireball++;
            addLog(`🔥 花費了 ${cost} 金幣，【火球術】升級到了 <b style="color:#e74c3c;">Lv.${player.skillLevels.fireball}</b>！傷害倍率提升！`);
        } else {
            addLog(`❌ 金幣不足，升級火球術需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'upgrade_lightning') {
        let cost = 250 + (player.skillLevels.lightning * 150);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.lightning++;
            addLog(`⚡ 花費了 ${cost} 金幣，【閃電斬】升級到了 <b style="color:#9b59b6;">Lv.${player.skillLevels.lightning}</b>！爆發力更恐怖了！`);
        } else {
            addLog(`❌ 金幣不足，升級閃電斬需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'upgrade_heal') {
        let cost = 200 + (player.skillLevels.heal * 100);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.heal++;
            addLog(`🌿 花費了 ${cost} 金幣，【治癒術】升級到了 <b style="color:#2ecc71;">Lv.${player.skillLevels.heal}</b>！護盾變得更厚了！`);
        } else {
            addLog(`❌ 金幣不足，升級治癒術需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'max_upgrade_fireball') {
        let totalCost = 0;
        let levelsGained = 0;
        let currentLv = player.skillLevels.fireball;
        
        // 瞬間計算你可以買幾級
        while (true) {
            let nextCost = 150 + ((currentLv + levelsGained) * 100);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                levelsGained++;
            } else {
                break;
            }
        }

        if (levelsGained > 0) {
            player.coin -= totalCost;
            player.skillLevels.fireball += levelsGained;
            addLog(`🔥 豪擲了 ${totalCost} 金幣，【火球術】一口氣提升了 ${levelsGained} 級，達到 <b style="color:#e74c3c;">Lv.${player.skillLevels.fireball}</b>！`);
        } else {
            addLog(`❌ 金幣不足，連升 1 級都不夠！`);
        }
    }
    else if (item === 'max_upgrade_lightning') {
        let totalCost = 0;
        let levelsGained = 0;
        let currentLv = player.skillLevels.lightning;
        
        while (true) {
            let nextCost = 250 + ((currentLv + levelsGained) * 150);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                levelsGained++;
            } else {
                break;
            }
        }

        if (levelsGained > 0) {
            player.coin -= totalCost;
            player.skillLevels.lightning += levelsGained;
            addLog(`⚡ 豪擲了 ${totalCost} 金幣，【閃電斬】一口氣提升了 ${levelsGained} 級，達到 <b style="color:#9b59b6;">Lv.${player.skillLevels.lightning}</b>！`);
        } else {
            addLog(`❌ 金幣不足，連升 1 級都不夠！`);
        }
    }
    else if (item === 'max_upgrade_heal') {
        let totalCost = 0;
        let levelsGained = 0;
        let currentLv = player.skillLevels.heal;
        
        while (true) {
            let nextCost = 200 + ((currentLv + levelsGained) * 100);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                levelsGained++;
            } else {
                break;
            }
        }

        if (levelsGained > 0) {
            player.coin -= totalCost;
            player.skillLevels.heal += levelsGained;
            addLog(`🌿 豪擲了 ${totalCost} 金幣，【治癒術】一口氣提升了 ${levelsGained} 級，達到 <b style="color:#2ecc71;">Lv.${player.skillLevels.heal}</b>！`);
        } else {
            addLog(`❌ 金幣不足，連升 1 級都不夠！`);
        }
    }
    // 🌟🌟🌟 經驗護符 MAX 購買邏輯 🌟🌟🌟
    else if (item === 'max_exp_amulet') {
        let totalCost = 0;
        let countGained = 0;
        let currentAmount = player.expAmulet;
        
        while (true) {
            let nextCost = 200 + ((currentAmount + countGained) * 150);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                countGained++;
            } else {
                break;
            }
        }

        if (countGained > 0) {
            player.coin -= totalCost;
            player.expAmulet += countGained;
            let currentBonus = Math.floor(1000000*(player.expAmulet / (player.expAmulet + 1000)))/1000;
            addLog(`✨ 豪擲了 ${totalCost} 金幣，一口氣狂買了 ${countGained} 個經驗護符！現在打怪會額外獲得 <b style="color:#f1c40f;">${currentBonus}%</b> 經驗值！`);
        } else {
            addLog(`❌ 金幣不足，連買 1 個經驗護符都不夠！`);
        }
    }

    // 🌟🌟🌟 金幣護符 MAX 購買邏輯 🌟🌟🌟
    else if (item === 'max_gold_amulet') {
        let totalCost = 0;
        let countGained = 0;
        let currentAmount = player.goldAmulet;
        
        while (true) {
            let nextCost = 200 + ((currentAmount + countGained) * 150);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                countGained++;
            } else {
                break;
            }
        }

        if (countGained > 0) {
            player.coin -= totalCost;
            player.goldAmulet += countGained;
            let currentBonus = player.goldAmulet * 5;
            addLog(`🪙 豪擲了 ${totalCost} 金幣，一口氣狂買了 ${countGained} 個金幣護符！現在獲得的金幣會額外增加 <b style="color:#f1c40f;">${currentBonus}%</b>！`);
        } else {
            addLog(`❌ 金幣不足，連買 1 個金幣護符都不夠！`);
        }
    }
    // 加在 buyItem 裡面其他的 else if 後面
    else if (item === 'windWalk_book') {
        if (player.coin >= 500) {
            player.coin -= 500;
            player.unlockedSkills.windWalk = true;
            addLog("📘 <b style='color:#1abc9c;'>你翻開了青色的技能書，學會了新技能：【🌪️ 風行】！</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    }
    else if (item === 'upgrade_windWalk') {
        let cost = 500 + (player.skillLevels.windWalk * 300);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.windWalk++;
            addLog(`🌪️ 花費 ${cost} 金幣，【風行】升級到了 <b style="color:#1abc9c;">Lv.${player.skillLevels.windWalk}</b>！連擊的強化倍率提升！`);
        } else {
            addLog(`❌ 金幣不足，升級風行需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'max_upgrade_windWalk') {
        let totalCost = 0;
        let levelsGained = 0;
        let currentLv = player.skillLevels.windWalk;
        
        while (true) {
            let nextCost = 500 + ((currentLv + levelsGained) * 300);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                levelsGained++;
            } else {
                break;
            }
        }
        if (levelsGained > 0) {
            player.coin -= totalCost;
            player.skillLevels.windWalk += levelsGained;
            addLog(`🌪️ 豪擲了 ${totalCost} 金幣，【風行】一口氣提升了 ${levelsGained} 級，達到 <b style="color:#1abc9c;">Lv.${player.skillLevels.windWalk}</b>！`);
        } else {
            addLog(`❌ 金幣不足，連升 1 級都不夠！`);
        }
    }
    else if (item === 'upgrade_holyLight') {
        let cost = 5000000 + (player.skillLevels.holyLight * 2000000);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.holyLight++;
            addLog(`✨ 花費 ${cost} 金幣，【聖光】升級到了 <b style="color:#f1c40f;">Lv.${player.skillLevels.holyLight}</b>！`);
        } else {
            addLog(`❌ 金幣不足，升級聖光需要 ${cost} 金幣。`);
        }
    }
    // --- 聖光升級 (MAX) ---
    else if (item === 'max_upgrade_holyLight') {
        let totalCost = 0;
        let levelsGained = 0;
        let currentLv = player.skillLevels.holyLight;
        
        while (true) {
            let nextCost = 5000000 + ((currentLv + levelsGained) * 2000000);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                levelsGained++;
            } else { break; }
        }
        if (levelsGained > 0) {
            player.coin -= totalCost;
            player.skillLevels.holyLight += levelsGained;
            addLog(`✨ 豪擲 ${totalCost} 金幣，【聖光】連升 ${levelsGained} 級，達到 <b style="color:#f1c40f;">Lv.${player.skillLevels.holyLight}</b>！`);
        } else {
            addLog(`❌ 金幣不足，連升 1 級都不夠！`);
        }
    }
    // --- 黑洞買書 ---
    else if (item === 'blackHole_book') {
        if (player.coin >= 100000000) { // 1億金幣
            player.coin -= 100000000;
            player.unlockedSkills.blackHole = true;
            addLog("🌌 <b style='color:#9b59b6;'>你窺探了深淵的盡頭，解鎖了3轉神技：【🌌 虛空黑洞】！</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    }
    // --- 黑洞升級 ---
    else if (item === 'upgrade_blackHole') {
        let cost = 50000000 + (player.skillLevels.blackHole * 20000000);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.blackHole++;
            addLog(`🌌 花費 ${cost} 金幣，【虛空黑洞】升級到了 <b style="color:#9b59b6;">Lv.${player.skillLevels.blackHole}</b>！`);
        } else {
            addLog(`❌ 金幣不足，升級黑洞需要 ${cost} 金幣。`);
        }
    }
    // --- 黑洞升級 (MAX) ---
    else if (item === 'max_upgrade_blackHole') {
        let totalCost = 0;
        let levelsGained = 0;
        let currentLv = player.skillLevels.blackHole;
        
        while (true) {
            let nextCost = 50000000 + ((currentLv + levelsGained) * 20000000);
            if (player.coin >= totalCost + nextCost) {
                totalCost += nextCost;
                levelsGained++;
            } else { break; }
        }
        if (levelsGained > 0) {
            player.coin -= totalCost;
            player.skillLevels.blackHole += levelsGained;
            addLog(`🌌 豪擲 ${totalCost} 金幣，【虛空黑洞】連升 ${levelsGained} 級，達到 <b style="color:#9b59b6;">Lv.${player.skillLevels.blackHole}</b>！`);
        } else {
            addLog(`❌ 金幣不足！`);
        }
    }
    // 🌟🌟🌟 購買強化石 🌟🌟🌟
    else if (item === 'enhance_stone') {
        let cost = 1000; // 一顆 1,000 金幣
        if (player.coin >= cost) {
            player.coin -= cost;
            player.enhanceStones++;
            addLog("💎 花費了 1,000 金幣，購買了 1 顆【強化石】！");
        } else {
            addLog("❌ 金幣不足！強化石需要 1,000 金幣。");
        }
    }
    // 🌟🌟🌟 MAX 狂買強化石 🌟🌟🌟
    else if (item === 'max_enhance_stone') {
        let cost = 1000;
        let maxBuy = Math.floor(player.coin / cost);
        if (maxBuy > 0) {
            player.coin -= (maxBuy * cost);
            player.enhanceStones += maxBuy;
            addLog(`💎 豪擲 ${maxBuy * cost} 金幣，一口氣狂買了 <b style="color:#3498db;">${maxBuy}</b> 顆【強化石】！`);
        } else {
            addLog("❌ 金幣不足！連 1 顆強化石都買不起。");
        }
    }
    saveGame(); 
    updateUI(); 
}

function calculateTotalAtk() {
    const weaponBonus = (player.equiptment && player.equiptment.weapon) ? player.equiptment.weapon.atkBonus : 0;
    const totalMin = player.baseAtk[0] + player.extraATK + weaponBonus;
    const totalMax = player.baseAtk[1] + player.extraATK + weaponBonus;
    return [totalMin, totalMax];
}

// --- 🎲 裝備掉落與機率判定 ---
function rollLoot() {
    let roll = Math.random(); 
    if (roll < 0.0001) {
        // 傳說級也有 50% 機率是防具
        if (Math.random() < 0.5) {
            return { name: "✨ 聖劍．艾斯卡諾 ✨", type: "weapon", rarity: "Mythic", atkBonus: 500, color: "#f39c12" };
        } else {
            return { name: "🛡️ 庇護之盾．埃癸斯 🛡️", type: "armor", rarity: "Mythic", defBonus: 500, color: "#f39c12" };
        }
    } else if (roll < 0.0301) {
        return generateRandomEquip("Epic", 50, 100);
    } else if (roll < 0.1801) {
        return generateRandomEquip("Rare", 20, 49);
    } else if (roll < 0.4801) {
        return generateRandomEquip("Uncommon", 10, 19);
    } else {
        return generateRandomEquip("Common", 1, 9);
    }
}

function generateRandomEquip(rarity, minStat, maxStat) {
    let isWeapon = Math.random() < 0.5; // 50% 機率是武器
    let randomStat = Math.floor(Math.random() * (maxStat - minStat + 1)) + minStat;
    randomStat += Math.floor(randomStat * player.level * 0.5); 

    if (isWeapon) {
        const weaponNames = ["長劍", "戰斧", "匕首", "巨劍", "太刀"];
        let randomName = weaponNames[Math.floor(Math.random() * weaponNames.length)];
        return { name: `【${rarity}】${randomName}`, type: "weapon", rarity: rarity, atkBonus: randomStat };
    } else {
        const armorNames = ["皮甲", "鐵甲", "長袍", "戰裙", "胸甲"];
        let randomName = armorNames[Math.floor(Math.random() * armorNames.length)];
        return { name: `【${rarity}】${randomName}`, type: "armor", rarity: rarity, defBonus: randomStat };
    }
}

function updateUI() {
    if (!player.inventory) player.inventory = [];
    if (!player.equiptment) player.equiptment = { weapon: null, armor: null };
    if (player.protectionAmulet === undefined) player.protectionAmulet = 0;
    if (!player.baseAtk) player.baseAtk = [5, 12];
    if (!player.atkRange) player.atkRange = [5, 12];
    if (player.extraATK === undefined) player.extraATK = 0; 
    if (!player.maxHp) player.maxHp = 100;
    if (!player.unlockedSkills) player.unlockedSkills = { fireball: true, lightning: false, heal: false };
    if (!player.skillLevels) player.skillLevels = { fireball: 1, lightning: 1, heal: 1 };
    if (player.currentArea === undefined) player.currentArea = 0;
    if (player.expAmulet === undefined) player.expAmulet = 0; 
    if (player.goldAmulet === undefined) player.goldAmulet = 0; 
    if (player.baseDef === undefined) player.baseDef = 0;
    if (player.extraDEF === undefined) player.extraDEF = 0;
    // 🌟 新增：轉生系統與神級技能的舊存檔保護
    if (player.rebirthCount === undefined) player.rebirthCount = 0;
    if (player.skills.holyLightCD === undefined) player.skills.holyLightCD = 0;
    if (player.unlockedSkills.holyLight === undefined) player.unlockedSkills.holyLight = false;
    // 🌟 在 updateUI 舊存檔防護區補上這行
    if (player.skillLevels.holyLight === undefined) player.skillLevels.holyLight = 1;
    if (player.skills.blackHoleCD === undefined) player.skills.blackHoleCD = 0;
    if (player.unlockedSkills.blackHole === undefined) player.unlockedSkills.blackHole = false;
    if (player.skillLevels.blackHole === undefined) player.skillLevels.blackHole = 1;
    if (player.towerFloor === undefined) player.towerFloor = 1;
    if (player.maxTowerFloor === undefined) player.maxTowerFloor = 1;
    if (!player.stats) player.stats = { kills: 0, maxDamage: 0, totalGold: 0 };
    // 🌟 強化石系統存檔保護
    if (player.enhanceStones === undefined) player.enhanceStones = 0;
    
    // 順便把轉生次數顯示在畫面上 (如果你有在 HTML 寫玩家名字，可以接在名字後面)
    document.getElementById('player-level').innerText = `Lv.${player.level} (轉生: ${player.rebirthCount})`;
    
    // 🌟🌟🌟 新增：針對「風行」技能的舊存檔保護機制 🌟🌟🌟
    if (player.skills.windWalkCD === undefined) player.skills.windWalkCD = 0;
    if (player.unlockedSkills.windWalk === undefined) player.unlockedSkills.windWalk = false;
    if (player.skillLevels.windWalk === undefined) player.skillLevels.windWalk = 1;
    if (player.windWalkActive === undefined) player.windWalkActive = false;
    // 🌟🌟🌟 新增結束 🌟🌟🌟

    if (player.currentArea === undefined) player.currentArea = 0;
    player.atkRange = calculateTotalAtk();
    // 🌟 舊存檔保護區塊加入這行：
    if (player.autoDismantle === undefined) player.autoDismantle = false;

    // 🌟 讓畫面上的打勾狀態與存檔同步：
    const autoDismantleCb = document.getElementById('auto-dismantle-cb');
    if (autoDismantleCb && autoDismantleCb.checked !== player.autoDismantle) {
        autoDismantleCb.checked = player.autoDismantle;
    }
// 🌟 在 updateUI() 裡面找到這段並替換：
    let armorBonus = (player.equiptment && player.equiptment.armor) ? player.equiptment.armor.defBonus : 0;
    let totalDEF = player.baseDef + player.extraDEF + armorBonus; // 加上裝備防禦！
    
    
    let playerDefElement = document.getElementById('player-def');
    let defReductionElement = document.getElementById('def-reduction');
    if (playerDefElement && defReductionElement) {
        playerDefElement.innerText = totalDEF;
        let reductionPercent = (1 - (1000 / (1000 + totalDEF))) * 100;
        defReductionElement.innerText = `(減傷 ${reductionPercent.toFixed(1)}%)`;
    }

    const amuletText = document.getElementById('amulet-text');
    if (amuletText) {
        let expCost = 200 + (player.expAmulet * 100);
        let currentExpPercent = Math.floor(1000000*(player.expAmulet / (player.expAmulet + 1000)))/1000 ;
        amuletText.innerText = `✨ 經驗護符 (+${currentExpPercent}% 經驗) (${expCost}g)`;
    }

    const goldAmuletText = document.getElementById('gold-amulet-text');
    if (goldAmuletText) {
        let cost = 200 + (player.goldAmulet * 150); 
        let bonus = player.goldAmulet * 5; 
        goldAmuletText.innerText = `🪙 金幣護符 (+${bonus}% 金幣) (${cost}g)`;
    }
    // 🌟 轉蛋機價格動態更新 (基礎價 1000 × 玩家等級)
    let gachaText = document.getElementById('gacha-text');
    if (gachaText) {
        let currentGachaCost = 1000 * player.level; 
        gachaText.innerText = `🎰 傳說裝備轉蛋 (${currentGachaCost}g / 次)`;
    }

    document.getElementById('player-hp').innerText = `${player.hp} / ${player.maxHp}`;
    const hpFill = document.getElementById('player-hp-fill');
    if (player.hp > player.maxHp) {
        hpFill.style.width = "100%";
        hpFill.style.backgroundColor = "#f1c40f"; 
        document.getElementById('player-hp').innerText = `🛡️ ${player.hp} / ${player.maxHp}`;
    } else {
        hpFill.style.width = (player.hp / player.maxHp * 100) + "%";
        hpFill.style.backgroundColor = "#2ecc71"; 
    }
    
    document.getElementById('player-level').innerText = player.level;
    document.getElementById('player-exp').innerText = `${player.exp} / ${player.nextLevelExp}`;
    document.getElementById('player-exp-fill').style.width = (player.exp / player.nextLevelExp * 100) + "%";
    document.getElementById('player-coin-display').innerText = player.coin;
    let shopCoinEl = document.getElementById('shop-coin-display');
    if (shopCoinEl) {
        // 使用 toLocaleString() 可以幫數字加上千位數逗號，例如 100,000,000，看起來更直覺！
        shopCoinEl.innerText = player.coin.toLocaleString(); 
    }
    
    const amuletDisplay = document.getElementById('player-amulet-display');
    if(amuletDisplay) amuletDisplay.innerText = player.protectionAmulet;

    const atkText = `${player.atkRange[0]} - ${player.atkRange[1]}`;
    const atkDisplay = document.getElementById('player-atk-display');
    if(atkDisplay) atkDisplay.innerText = atkText;
    
    const atkElement = document.getElementById('player-atk');
    if (atkElement) {
        const bonus = player.extraATK + ((player.equiptment.weapon) ? player.equiptment.weapon.atkBonus : 0);
        atkElement.innerText = `${player.baseAtk[0]} ~ ${player.baseAtk[1]} (總加成: +${bonus})`;
    }

    const swordPriceElement = document.getElementById('sword-price');
    if (swordPriceElement) {
        let currentCost = 100 + (player.extraATK * 10); 
        swordPriceElement.innerText = currentCost;
    }

    const ltBtn = document.getElementById('lightning-btn');
    if (ltBtn) {
        const isLtUnlocked = player.unlockedSkills.lightning;
        ltBtn.style.display = isLtUnlocked ? 'inline-block' : 'none';
        if (isLtUnlocked) {
            ltBtn.disabled = player.skills.lightningCD > 0;
            ltBtn.innerText = player.skills.lightningCD > 0 ? `⚡ CD ${player.skills.lightningCD}` : "⚡ 閃電斬";
        }
    }

    if (player.unlockedSkills && player.skillLevels) {
        const upgFb = document.getElementById('shop-upg-fireball');
        if (upgFb) {
            upgFb.style.display = 'flex'; 
            let costFb = 200 + (player.skillLevels.fireball * 150); 
            document.getElementById('fireball-upg-text').innerText = `🔥 升級火球術 Lv.${player.skillLevels.fireball} (${costFb}g)`;
        }

        const upgLt = document.getElementById('shop-upg-lightning');
        if (upgLt) {
            upgLt.style.display = player.unlockedSkills.lightning ? 'flex' : 'none';
            let costLt = 300 + (player.skillLevels.lightning * 200);
            document.getElementById('lightning-upg-text').innerText = `⚡ 升級閃電斬 Lv.${player.skillLevels.lightning} (${costLt}g)`;
        }

        const upgHl = document.getElementById('shop-upg-heal');
        if (upgHl) {
            upgHl.style.display = player.unlockedSkills.heal ? 'flex' : 'none';
            let costHl = 250 + (player.skillLevels.heal * 150);
            document.getElementById('heal-upg-text').innerText = `🌿 升級治癒術 Lv.${player.skillLevels.heal} (${costHl}g)`;
        }
    }

    const hlBtn = document.getElementById('heal-btn');
    if (hlBtn) {
        const isHlUnlocked = player.unlockedSkills.heal;
        hlBtn.style.display = isHlUnlocked ? 'inline-block' : 'none';
        if (isHlUnlocked) {
            hlBtn.disabled = player.skills.healCD > 0;
            hlBtn.innerText = player.skills.healCD > 0 ? `🌿 CD ${player.skills.healCD}` : "🌿 治癒術";
        }
    }
    
    const fbBtn = document.getElementById('fireball-btn');
    if(fbBtn) {
        fbBtn.disabled = player.skills.fireballCD > 0;
        fbBtn.innerText = player.skills.fireballCD > 0 ? `🔥 CD ${player.skills.fireballCD}` : "🔥 火球術";
    }
    // 控制黑洞技能書顯示 (達 3 轉且未學會)
    let shopBlackHole = document.getElementById('shop-blackHole');
    if (shopBlackHole) shopBlackHole.style.display = (player.rebirthCount >= 3 && !player.unlockedSkills.blackHole) ? 'flex' : 'none';

    // 控制黑洞升級區塊 (已學會)
    let upgBlackHole = document.getElementById('shop-upg-blackHole');
    if (upgBlackHole) {
        upgBlackHole.style.display = player.unlockedSkills.blackHole ? 'flex' : 'none';
        let costBH = 50000000 + (player.skillLevels.blackHole * 20000000);
        document.getElementById('blackHole-upg-text').innerText = `🌌 升級黑洞 Lv.${player.skillLevels.blackHole} (${costBH}g)`;
    }
    
    // 控制黑洞戰鬥按鈕
    const bhBtn = document.getElementById('blackhole-btn');
    if (bhBtn) {
        bhBtn.style.display = player.unlockedSkills.blackHole ? 'inline-block' : 'none';
        if (player.unlockedSkills.blackHole) {
            bhBtn.disabled = player.skills.blackHoleCD > 0;
            bhBtn.innerText = player.skills.blackHoleCD > 0 ? `🌌 CD ${player.skills.blackHoleCD}` : "🌌 黑洞";
        }
    }
    const shopLt = document.getElementById('shop-lightning');
    if (shopLt) shopLt.style.display = player.unlockedSkills.lightning ? 'none' : 'flex';
    const shopHl = document.getElementById('shop-heal');
    if (shopHl) shopHl.style.display = player.unlockedSkills.heal ? 'none' : 'flex';

    // 🌟 更新統計面板 (使用內建的縮寫格式，例如 1.5M, 2.3B, 1.2T)
    const formatter = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 });
    
    let statKillsEl = document.getElementById('stat-kills');
    let statMaxDmgEl = document.getElementById('stat-max-dmg');
    let statTotalGoldEl = document.getElementById('stat-total-gold');

    if (statKillsEl && player.stats) statKillsEl.innerText = formatter.format(player.stats.kills);
    if (statMaxDmgEl && player.stats) {
        let maxD = player.stats.maxDamage;
        
        // 如果傷害突破 1 兆 (1,000,000,000,000，也就是 1e12)，啟動指數顯示
        if (maxD >= 1e12) {
            // toExponential(2) 會保留小數點後兩位，例如 1.52e+24
            // 為了讓遊戲看起來更帥，我們把 'e+' 換成大寫的 ' E'
            statMaxDmgEl.innerText = maxD.toExponential(2).replace('e+', ' E'); 
        } else {
            // 兆以下的傷害，還是用原本的 K, M, B 格式
            statMaxDmgEl.innerText = formatter.format(maxD);
        }
    }
    if (statTotalGoldEl && player.stats) statTotalGoldEl.innerText = formatter.format(player.stats.totalGold);

    // 更新強化石 UI
    let stoneDisplay = document.getElementById('stone-display');
    if (stoneDisplay) {
        stoneDisplay.innerText = player.enhanceStones.toLocaleString();
    }

// ==========================================
    // 🌟 UI 狀態管理：戰鬥中 vs 非戰鬥中
    // ==========================================
    // ==========================================
    // 🌟 UI 狀態管理：戰鬥中 vs 非戰鬥中
    // ==========================================
    let monsterNameEl = document.getElementById('monster-name');
    let monsterImgEl = document.getElementById('monster-img'); // 對接你的 img ID
    let placeholderTextEl = document.getElementById('placeholder-text'); // 對接你的提示文字
    let monsterHpEl = document.getElementById('monster-hp'); // 對接你的血量文字
    let monsterHpFillEl = document.getElementById('monster-hp-fill'); // 對接你的血條
    
    let exploreBtn = document.getElementById('explore-btn'); 
    let battleActions = document.getElementById('battle-actions'); 
    let towerContainer = document.getElementById('tower-container');

    if (currentMonster) {
        // --- ⚔️ 狀態：戰鬥中 ---
        if (monsterNameEl) monsterNameEl.innerText = currentMonster.name;
        
        // 顯示圖片，隱藏「點擊下方按鈕...」提示
        if (monsterImgEl) {
            monsterImgEl.src = currentMonster.image; 
            // 如果你原本的 CSS 是置中，這裡通常用 'block' 或是原本就留空讓 CSS 控制
            monsterImgEl.style.display = 'block'; 
        }
        if (placeholderTextEl) placeholderTextEl.style.display = 'none';
        
        // 🌟 啟動血量文字與血條動畫
        if (monsterHpEl) monsterHpEl.innerText = `${currentMonster.hp} / ${currentMonster.maxHp}`;
        if (monsterHpFillEl) {
            let hpPercent = Math.max(0, (currentMonster.hp / currentMonster.maxHp) * 100);
            monsterHpFillEl.style.width = hpPercent + "%";
        }
        
        // 隱藏非戰鬥按鈕，顯示戰鬥技能
        if (exploreBtn) exploreBtn.style.display = 'none';
        if (towerContainer) towerContainer.style.display = 'none';
        if (battleActions) battleActions.style.display = 'flex'; 

    } else {
        // --- 🏕️ 狀態：準備探險 (非戰鬥) ---
        if (monsterNameEl) monsterNameEl.innerText = "🌲 準備探險...";
        
        // 隱藏圖片，顯示「點擊下方按鈕...」提示
        if (monsterImgEl) {
            monsterImgEl.src = ""; 
            monsterImgEl.style.display = 'none'; 
        }
        if (placeholderTextEl) placeholderTextEl.style.display = 'block';

        // 🌟 恢復休息中狀態，血條歸零
        if (monsterHpEl) monsterHpEl.innerText = "休息中";
        if (monsterHpFillEl) monsterHpFillEl.style.width = "0%";

        // 隱藏戰鬥技能，顯示探險與爬塔按鈕
        if (battleActions) battleActions.style.display = 'none';
        if (exploreBtn) exploreBtn.style.display = 'inline-block'; 
        
        // 判斷是否要顯示爬塔面板
        if (towerContainer) {
            if (player.rebirthCount >= 1) {
                towerContainer.style.display = 'block';
                let floorText = document.getElementById('tower-floor-text');
                if (floorText) {
                    floorText.innerHTML = `目前層數：第 ${player.towerFloor} 層 <br><span style="font-size: 0.8em; color: #bdc3c7;">(歷史最高：第 ${player.maxTowerFloor} 層)</span>`;
                }
            } else {
                towerContainer.style.display = 'none';
            }
        }
    }

    // --- 🌟 更新獨立裝備欄 (Paper Doll) ---
    const eqWeaponElem = document.getElementById('equipped-weapon');
    const eqArmorElem = document.getElementById('equipped-armor');

    if (eqWeaponElem) {
        if (player.equiptment.weapon) {
            eqWeaponElem.innerHTML = `<b style="color: #e74c3c;">${player.equiptment.weapon.name}</b> (+${player.equiptment.weapon.atkBonus})`;
        } else {
            eqWeaponElem.innerHTML = `<span style="color: #7f8c8d;">(未裝備)</span>`;
        }
    }

    if (eqArmorElem) {
        if (player.equiptment.armor) {
            eqArmorElem.innerHTML = `<b style="color: #3498db;">${player.equiptment.armor.name}</b> (+${player.equiptment.armor.defBonus})`;
        } else {
            eqArmorElem.innerHTML = `<span style="color: #7f8c8d;">(未裝備)</span>`;
        }
    }
    // 放在 updateUI 處理技能按鈕的地方
    const windBtn = document.getElementById('wind-btn');
    if (windBtn) {
        const isWindUnlocked = player.unlockedSkills.windWalk;
        windBtn.style.display = isWindUnlocked ? 'inline-block' : 'none';
        if (isWindUnlocked) {
            windBtn.disabled = player.skills.windWalkCD > 0 || player.windWalkActive;
            let activeText = player.windWalkActive ? " (啟動中)" : "";
            windBtn.innerText = player.skills.windWalkCD > 0 ? `🌪️ CD ${player.skills.windWalkCD}` : `🌪️ 風行${activeText}`;
            windBtn.style.backgroundColor = player.windWalkActive ? "#16a085" : ""; // 啟動時改變顏色
        }
    }

    const shopWind = document.getElementById('shop-windWalk');
    if (shopWind) shopWind.style.display = player.unlockedSkills.windWalk ? 'none' : 'flex';
    
    const upgWind = document.getElementById('shop-upg-windWalk');
    if (upgWind) {
        upgWind.style.display = player.unlockedSkills.windWalk ? 'flex' : 'none';
        let costWind = 500 + (player.skillLevels.windWalk * 300);
        document.getElementById('windWalk-upg-text').innerText = `🌪️ 升級風行 Lv.${player.skillLevels.windWalk} (${costWind}g)`;
    }
    // 控制轉生按鈕顯示 (滿 1000 級才顯示)
    let rebirthContainer = document.getElementById('rebirth-container');
    if (rebirthContainer) {
        rebirthContainer.style.display = player.level >= 1000 ? 'block' : 'none';
    }

    // 控制聖光技能書顯示 (必須達 1 轉，且還沒學會)
    let shopHolyLight = document.getElementById('shop-holyLight');
    if (shopHolyLight) {
        if (player.rebirthCount >= 1 && !player.unlockedSkills.holyLight) {
            shopHolyLight.style.display = 'flex';
        } else {
            shopHolyLight.style.display = 'none';
        }
    }
    let upgHolyLight = document.getElementById('shop-upg-holyLight');
    if (upgHolyLight) {
        // 「已學會」才顯示升級按鈕
        upgHolyLight.style.display = player.unlockedSkills.holyLight ? 'flex' : 'none';
        let costHoly = 5000000 + (player.skillLevels.holyLight * 2000000);
        document.getElementById('holyLight-upg-text').innerText = `✨ 升級聖光 Lv.${player.skillLevels.holyLight} (${costHoly}g)`;
    }
    
    // 控制聖光戰鬥按鈕
    const holyBtn = document.getElementById('holy-btn');
    if (holyBtn) {
        holyBtn.style.display = player.unlockedSkills.holyLight ? 'inline-block' : 'none';
        if (player.unlockedSkills.holyLight) {
            holyBtn.disabled = player.skills.holyLightCD > 0;
            holyBtn.innerText = player.skills.holyLightCD > 0 ? `✨ CD ${player.skills.holyLightCD}` : "✨ 聖光";
        }
    }
        
    // 🌟 升級這裡：同時顯示「目前層數」與「歷史最高層數」
    let floorText = document.getElementById('tower-floor-text');
        if (floorText) {
        floorText.innerHTML = `目前層數：第 ${player.towerFloor} 層 <br><span style="font-size: 0.8em; color: #bdc3c7;">(歷史最高：第 ${player.maxTowerFloor} 層)</span>`;
        }
    renderInventory();
    renderAreaSelector();
}

function addLog(msg) {
    const logBox = document.getElementById('log');
    if(!logBox) return;
    const p = document.createElement('p');
    p.innerHTML = msg;
    logBox.prepend(p);
}

// --- 存檔與讀檔功能 ---
function saveGame() {
    const gameData = JSON.stringify(player); 
    localStorage.setItem('myRpgSave', gameData);
    addLog("<b style='color: #43b581;'>💾 遊戲已自動存檔！</b>");
}

function loadGame() {
    const savedData = localStorage.getItem('myRpgSave');
    if (savedData) {
        player = JSON.parse(savedData); 
        player.skills.fireballCD = 0;
        player.skills.lightningCD = 0;
        player.skills.healCD = 0;
        addLog("<b style='color: #7289da;'>📖 已載入上次的冒險進度！</b>");
    }
}

// --- 戰鬥與成長邏輯 ---
function checkLevelUp() {
    if (player.exp >= player.nextLevelExp) {
        player.exp -= player.nextLevelExp;
        player.level++;
        
        if (player.hp < player.maxHp) {
            player.hp = player.maxHp; 
        } else {
            player.hp += 20; 
        }

        let rebirthMultiplier = 1 + player.rebirthCount;
        player.maxHp += Math.floor(20 * rebirthMultiplier);
        player.hp += Math.floor(20 * rebirthMultiplier); 
        player.baseAtk[0] += Math.floor(2 * rebirthMultiplier);
        player.baseAtk[1] += Math.floor(4 * rebirthMultiplier);
        if(player.level >=15) {
            player.nextLevelExp = Math.floor(100 * Math.pow(player.level, 2));
        }else{
            player.nextLevelExp = Math.floor(100 * Math.pow(1.5, player.level - 1));
        }
        
        addLog(`<b style="color: #f1c40f;">✨ 恭喜升級！目前等級：LV.${player.level}</b>`);
        checkLevelUp(); 
    }
}

function explore() {
    if (currentMonster) return; 

    const shopContainer = document.getElementById('shop-container');
    if(shopContainer) shopContainer.style.display = 'none';
    
    if (Math.floor(player.level / 5) > Math.floor(player.bossDefeatedLevel / 5)) {
        spawnBoss();
        return; 
    }

    addLog("🌲 你進入了危險區域探險...");
    
    if (Math.random() < 0.8) {
        const currentAreaMonsters = areas[player.currentArea].monsters;
        const randomIndex = Math.floor(Math.random() * currentAreaMonsters.length);
        currentMonster = { ...currentAreaMonsters[randomIndex] }; 
        currentMonster.atk = [...currentAreaMonsters[randomIndex].atk];

        let hpMultiplier = Math.pow(player.level, 2)/2 ;
        let atkMultiplier = 1 + (player.level - 1) * 0.25;
        let expMultiplier = Math.pow(player.level, 2)/5;
        let coinMultiplier = Math.pow(player.level, 2)/1.5;
        if(player.level<15) {
            expMultiplier = Math.pow(1.5, player.level - 1);
            coinMultiplier = Math.pow(1.7, player.level - 1);
            }
        let defMultiplier =  player.level *0.2;
        currentMonster.maxHp = Math.floor(currentMonster.maxHp * hpMultiplier);
        currentMonster.hp = currentMonster.maxHp; 
        currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
        currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
        currentMonster.def = Math.floor((currentMonster.def || 0) * defMultiplier);
        
        let maxExpBonus = 20; 
        let expK = 1000; 
    
        let expBonusRate = 1 + (maxExpBonus * (player.expAmulet / (player.expAmulet + expK)));
        currentMonster.exp = Math.floor(currentMonster.exp * expMultiplier * expBonusRate);
        let goldBonusRate = 1 + (player.goldAmulet * 0.05); 
        currentMonster.coin = Math.floor(currentMonster.coin * coinMultiplier * goldBonusRate)*(player.rebirthCount+1);

        currentMonster.name = `Lv.${player.level} ${currentMonster.name}`;

        addLog(`⚠️ 警告！你遭遇了 <b>${currentMonster.name}</b>！`);
        
        document.getElementById('battle-actions').style.display = 'inline-block';
        document.getElementById('explore-btn').style.display = 'none';
    } else {
        let baseFound = Math.floor(Math.random() * 10) + 5;
        let finalFound = Math.floor(baseFound * (1 + (player.level - 1) * 0.2));
        let goldBonusRate = 1 + (player.goldAmulet * 0.05);
        finalFound = Math.floor(finalFound * goldBonusRate*(player.rebirthCount+1));
        
        player.coin += finalFound;
        addLog(`💰 你在路邊撿到了 ${finalFound} 枚金幣！`);
        player.stats.totalGold += finalFound;
        saveGame();
    }
    updateUI();
}

function spawnBoss() {
    addLog("<b style='color: red; font-size: 1.2em;'>🚨 警告！你驚動了強大的領域領主！ 🚨</b>");
    
    const currentAreaBoss = areas[player.currentArea].boss;
    currentMonster = { ...currentAreaBoss };
    currentMonster.atk = [...currentAreaBoss.atk];
    let bossexpMultiplier=Math.pow(player.level, 2)/5;
    let bosscoinMultiplier=Math.pow(player.level, 2)/1.5;
    let bossMultiplier = Math.pow(player.level, 2); 
    let atkMultiplier = 1 + (player.level - 1) * 0.5;
    if(player.level<=15) {
        bossexpMultiplier = Math.pow(1.2, player.level - 1);
        bosscoinMultiplier = Math.pow(1.7, player.level - 1);
        bossMultiplier = Math.pow(1.2, player.level - 1);
    }
    let defMultiplier =  Math.pow(player.level, 2)*0.3;
    currentMonster.maxHp = Math.floor(currentMonster.maxHp * bossMultiplier);
    currentMonster.hp = currentMonster.maxHp;
    currentMonster.def = Math.floor((currentMonster.def || 0) * defMultiplier);
    

    currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
    currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
    let maxExpBonus = 20; 
    let expK = 1000; 
    
    let expBonusRate = 1 + (maxExpBonus * (player.expAmulet / (player.expAmulet + expK)));
    currentMonster.exp = Math.floor(currentMonster.exp * bossexpMultiplier * expBonusRate);
    let goldBonusRateBoss = 1 + ((player.goldAmulet || 0) * 0.05);
    currentMonster.coin = Math.floor(currentMonster.coin * bosscoinMultiplier * goldBonusRateBoss)*(player.rebirthCount+1);
    currentMonster.name = `💀 領域領主：${currentMonster.name} (Lv.${player.level})`;

    const hpFill = document.getElementById('monster-hp-fill');
    if(hpFill) hpFill.style.backgroundColor = "darkred";

    document.getElementById('battle-actions').style.display = 'inline-block';
    document.getElementById('explore-btn').style.display = 'none';
    updateUI();
}

// 🌟🌟🌟 全新防禦減傷計算區塊 🌟🌟🌟
function attack() {
    if (!currentMonster || player.hp <= 0) return;
    sounds.attack.currentTime = 0;
    sounds.attack.play().catch(e => console.log("音效未觸發"));

    let rawDmg = Math.floor(Math.random() * (player.atkRange[1] - player.atkRange[0] + 1)) + player.atkRange[0];
    
    // 🌟 風行判定邏輯
    let hits = 1;
    let windMultiplier = 1;
    if (player.windWalkActive) {
        hits = 2;
        // 強化倍率：技能等級越高，第二下的傷害越誇張 (1 + 等級*0.5)
        windMultiplier = 1 + (player.skillLevels.windWalk * 0.5); 
        player.windWalkActive = false; // 消耗狀態
    }

    let monsterDef = currentMonster.def || 0;
    let dmgMultiplier = 1000 / (1000 + monsterDef);
    
    let totalFinalDmg = 0;
    let totalBlocked = 0;

    // 執行連擊迴圈
    for(let i=0; i<hits; i++) {
        let currentRaw = i === 1 ? Math.floor(rawDmg * windMultiplier) : rawDmg;
        let currentFinal = Math.max(1, Math.floor(currentRaw * dmgMultiplier));
        currentMonster.hp -= currentFinal;
        totalFinalDmg += currentFinal;
        totalBlocked += (currentRaw - currentFinal);
    }
    
    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c;">【風行連斬】</b> ⚔️ 普攻化作殘影連續打擊！造成 <b style="color:#e74c3c;">${totalFinalDmg}</b> 總傷害！(抵擋 ${totalBlocked} 點)`);
    } else {
        addLog(`⚔️ 你攻擊了，造成 ${totalFinalDmg} 點傷害。(被抵擋了 ${totalBlocked} 點)`);
    }
    recordDamage(totalFinalDmg);
    checkBattle();
}

function useFireball() {
    if (!currentMonster || player.skills.fireballCD > 0) return;
    if (sounds.fireball) { sounds.fireball.currentTime = 0; sounds.fireball.play().catch(e => {}); }

    let baseDmg = Math.floor(Math.random() * (player.atkRange[1] - player.atkRange[0] + 1)) + player.atkRange[0];
    let skillLv = player.skillLevels.fireball;
    let rawDmg = Math.floor(baseDmg * (1.5 + (skillLv-1) * 1)) + (skillLv * 70);
    
    // 🌟 風行判定邏輯
    let hits = 1;
    let windMultiplier = 1;
    if (player.windWalkActive) {
        hits = 2;
        windMultiplier = 1 + (player.skillLevels.windWalk * 0.5);
        player.windWalkActive = false;
    }

    let monsterDef = currentMonster.def || 0;
    let dmgMultiplier = 1000 / (1000 + monsterDef);
    
    let totalFinalDmg = 0;
    let totalBlocked = 0;

    for(let i=0; i<hits; i++) {
        let currentRaw = i === 1 ? Math.floor(rawDmg * windMultiplier) : rawDmg;
        let currentFinal = Math.max(1, Math.floor(currentRaw * dmgMultiplier));
        currentMonster.hp -= currentFinal;
        totalFinalDmg += currentFinal;
        totalBlocked += (currentRaw - currentFinal);
    }
    currentMonster.burnDuration = 3; // 持續 3 回合
    // ✅ 正確寫法：只在最外層，對「最終傷害」進行無條件捨去
    currentMonster.burnDmg = Math.floor(currentMonster.maxHp * (player.skillLevels.fireball / (player.skillLevels.fireball + 500)));
    player.skills.fireballCD = 4;
    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c;">【風行雙星】</b> 🔥 兩顆火球接連轟炸！造成驚人的 <b style="color:#e74c3c; font-size:1.1em;">${totalFinalDmg}</b> 總傷害！(抵擋 ${totalBlocked} 點)`);
    } else {
        addLog(`🔥 <b style="color:#e67e22;">火球術！</b> 造成了驚人的 <b style="color:#e74c3c; font-size:1.1em;">${totalFinalDmg}</b> 點傷害！(被抵擋了 ${totalBlocked} 點)`);
    }
    recordDamage(totalFinalDmg);
    checkBattle();
}

function useLightning() {
    if (!currentMonster || player.skills.lightningCD > 0) return;

    let skillLv = player.skillLevels.lightning;
    let trueDmg = Math.floor(player.atkRange[1] * (2.5 + (skillLv-1) * 3.0)) ;
    
    // 🌟 風行判定邏輯
    let hits = 1;
    let windMultiplier = 1;
    if (player.windWalkActive) {
        hits = 2;
        windMultiplier = 1 + (player.skillLevels.windWalk * 0.5);
        player.windWalkActive = false;
    }

    let totalFinalDmg = 0;
    for(let i=0; i<hits; i++) {
        let currentFinal = i === 1 ? Math.floor(trueDmg * windMultiplier) : trueDmg;
        currentMonster.hp -= currentFinal;
        totalFinalDmg += currentFinal;
    }

    player.skills.lightningCD = 5; 

    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c;">【風行神雷】</b> ⚡ 天雷降下兩次制裁！<span style="background-color: #f1c40f; color: black; padding: 0 4px; border-radius: 3px; font-weight: bold;">無視防禦</span> 劈出 <b style="color:#e74c3c; font-size:1.2em;">${totalFinalDmg}</b> 點真實總傷害！`);
    } else {
        addLog(`⚡ <b style="color:#9b59b6;">閃電斬！</b> <span style="background-color: #f1c40f; color: black; padding: 0 4px; border-radius: 3px; font-weight: bold;">無視防禦</span> 對敵人造成了 <b style="color:#e74c3c;">${totalFinalDmg}</b> 點真實傷害！`);
    }
    recordDamage(totalFinalDmg);
    checkBattle(); 
}
function useWindWalk() {
    if (!currentMonster || player.skills.windWalkCD > 0 || player.windWalkActive) return;

    player.windWalkActive = true;
    player.skills.windWalkCD = 6; // 冷卻 6 回合

    addLog(`🌪️ <b style="color:#1abc9c; font-size:1.1em;">風行啟動！</b> 風之精靈環繞著你，你的下一次行動將會被<b style="color:#f1c40f;">複製並大幅強化</b>！`);

    // 放 Buff 算一回合，怪物會趁機打你
    reduceCooldowns();
    monsterTurn();
    updateUI();
}
// --- ✨ 1轉專屬神技 (支援風行連擊版) ---
function useHolyLight() {
    if (!currentMonster || player.skills.holyLightCD > 0) return;

    let baseHolyDmg = Math.floor(player.maxHp * 0.1) + (player.atkRange[1]*10);
    let rawHolyDmg = baseHolyDmg * Math.pow(player.rebirthCount, 2) * (50+ player.skillLevels.holyLight * 20); 
    
    // 🌟 風行判定邏輯
    let hits = 1;
    let windMultiplier = 1;
    if (player.windWalkActive) {
        hits = 2;
        // 強化倍率：第二下吃風行技能等級加成
        windMultiplier = 1 + (player.skillLevels.windWalk * 0.5); 
        player.windWalkActive = false; // 消耗狀態
    }

    let totalFinalDmg = 0;

    // 執行連擊迴圈 (聖光是真實傷害，無視防禦)
    for(let i=0; i<hits; i++) {
        let currentFinal = i === 1 ? Math.floor(rawHolyDmg * windMultiplier) : rawHolyDmg;
        currentMonster.hp -= currentFinal;
        totalFinalDmg += currentFinal;
    }

    player.skills.holyLightCD = 7; 

    // 戰鬥廣播
    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c; font-size:1.2em;">【風行．超新星】</b> ✨ 兩道聖光接連貫穿天際！造成了 <b style="color:#e74c3c; font-size:1.5em;">${totalFinalDmg}</b> 點滅世級真實總傷害！`);
    } else {
        addLog(`✨ <b style="color:#f1c40f; font-size:1.3em;">【神罰．聖光】</b> 降臨！星辰之力貫穿了 ${currentMonster.name}，造成 <b style="color:#e74c3c; font-size:1.3em;">${totalFinalDmg}</b> 點毀滅性真實傷害！`);
    }
    recordDamage(totalFinalDmg);
    checkBattle();
}
// --- 🌌 3轉專屬神技：虛空黑洞 ---
function useBlackHole() {
    if (!currentMonster || player.skills.blackHoleCD > 0) return;

    let skillLv = player.skillLevels.blackHole;
    // 基礎傷害極高：最大血量 20% + 攻擊力上限 * 20
    let baseBHDmg = Math.floor(player.maxHp * 0.2) + (player.atkRange[1] * 20);
    
    // 🌟 三次方爆發公式：基礎傷害 × (轉生次數的 3 次方) × (100 + 技能等級 × 50)
    let rawBHDmg = baseBHDmg * Math.pow(player.rebirthCount, 3) * (100 + skillLv * 50); 
    
    // 🌟 風行判定邏輯
    let hits = 1;
    let windMultiplier = 1;
    if (player.windWalkActive) {
        hits = 2;
        windMultiplier = 1 + (player.skillLevels.windWalk * 0.5); 
        player.windWalkActive = false; 
    }

    let totalFinalDmg = 0;

    for(let i=0; i<hits; i++) {
        let currentFinal = i === 1 ? Math.floor(rawBHDmg * windMultiplier) : rawBHDmg;
        currentMonster.hp -= currentFinal;
        totalFinalDmg += currentFinal;
    }

    // 🌟 黑洞特有：吞噬吸血 (將 30% 真實傷害轉化為自身護盾)
    let lifesteal = Math.floor(totalFinalDmg * 0.3);
    player.hp += lifesteal;

    player.skills.blackHoleCD = 10; // 滅世級冷卻：10回合

    // 戰鬥廣播
    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c; font-size:1.2em;">【風行．維度崩塌】</b> 🌌 兩顆黑洞互相吸引引發宇宙爆炸！造成 <b style="color:#9b59b6; font-size:1.5em;">${totalFinalDmg}</b> 點毀滅傷害，並吞噬了 <b style="color:#2ecc71;">${lifesteal}</b> 點生命護盾！`);
    } else {
        addLog(`🌌 <b style="color:#9b59b6; font-size:1.3em;">【虛空黑洞】</b> 撕裂了空間！對 ${currentMonster.name} 造成 <b style="color:#e74c3c; font-size:1.3em;">${totalFinalDmg}</b> 點真實傷害，並吸收 <b style="color:#2ecc71;">${lifesteal}</b> 點護盾！`);
    }
    
    // 更新護盾 UI
    const hpFill = document.getElementById('player-hp-fill');
    if (player.hp > player.maxHp && hpFill) {
        hpFill.style.backgroundColor = "#f1c40f"; 
        hpFill.style.width = "100%"; 
        document.getElementById('player-hp').innerText = `🛡️ ${player.hp} / ${player.maxHp}`;
    }
    recordDamage(totalFinalDmg);
    checkBattle();
}
function monsterTurn() {
    // 🌟🌟🌟 結算狀態異常 (在怪物攻擊前結算) 🌟🌟🌟
    if (currentMonster.burnDuration && currentMonster.burnDuration > 0) {
        currentMonster.hp -= currentMonster.burnDmg;
        currentMonster.burnDuration--;
        
        addLog(`🔥 <b style="color:#e67e22;">燃燒發作！</b> ${currentMonster.name} 受到 <b style="color:#e74c3c;">${currentMonster.burnDmg}</b> 點灼燒傷害！(剩餘 ${currentMonster.burnDuration} 回合)`);

        // 如果怪物被燒死了，直接結算戰鬥並「中斷」怪物的攻擊！
        if (currentMonster.hp <= 0) {
            checkBattle();
            return; // 🌟 關鍵：直接 return 結束函數，怪物就無法反擊了
        }
    }
    // 🌟🌟🌟 狀態異常結算結束 🌟🌟🌟

    // 原本的怪物反擊邏輯
    let rawDmg = Math.floor(Math.random() * (currentMonster.atk[1] - currentMonster.atk[0])) + currentMonster.atk[0];
    
    let armorBonus = (player.equiptment && player.equiptment.armor) ? player.equiptment.armor.defBonus : 0;
    let totalDEF = (player.baseDef || 0) + (player.extraDEF || 0) + armorBonus;
    
    let dmgMultiplier = 1000 / (1000 + totalDEF);
    let finalDmg = Math.max(1, Math.floor(rawDmg * dmgMultiplier));

    player.hp -= finalDmg;
    addLog(`👾 ${currentMonster.name} 反擊，你受到 ${finalDmg} 點傷害。(你抵擋了 ${rawDmg - finalDmg} 點)`);
    if (player.hp <= 0) {
        player.hp = 0; // 防止血量變成負的
        
        if (currentMonster && currentMonster.isTower) {
            // 🌟 塔內陣亡特製廣播 (沒有死亡懲罰，只是被踢出去)
            addLog(`💀 <b style="color:#c0392b; font-size:1.2em;">你在無盡之塔 第 ${player.towerFloor} 層 隕落了...</b>`);
            addLog("✨ 虛空的強大能量將你遣送回了安全的城鎮。請提升實力後再來挑戰！");
        } else {
            addLog("<b style='color:red; font-size:1.2em;'>💀 你倒下了... 請選擇復活。</b>");
            
            document.getElementById('battle-actions').style.display = 'none';
            
            const exploreBtn = document.getElementById('explore-btn');
            exploreBtn.style.display = 'inline-block';
            exploreBtn.innerText = "☠️ 接受命運並復活";
            exploreBtn.style.backgroundColor = "#e74c3c"; 
            exploreBtn.onclick = revive; 
        }

        // 強制結束戰鬥，清空怪物
        currentMonster = null; 
        
        // 刷新畫面並存檔
        updateUI();
        saveGame();
        return; // 中斷後續的戰鬥計算
    }
    if (player.hp <= 0) {
        player.hp = 0;
        addLog("<b style='color:red; font-size:1.2em;'>💀 你倒下了... 請選擇復活。</b>");
        
        document.getElementById('battle-actions').style.display = 'none';
        
        const exploreBtn = document.getElementById('explore-btn');
        exploreBtn.style.display = 'inline-block';
        exploreBtn.innerText = "☠️ 接受命運並復活";
        exploreBtn.style.backgroundColor = "#e74c3c"; 
        exploreBtn.onclick = revive; 
    }
}
// 🌟🌟🌟 減傷計算區塊結束 🌟🌟🌟

function useHeal() {
    if (!currentMonster || player.skills.healCD > 0) return;

    let skillLv = player.skillLevels.heal;
    let healAmount = Math.floor(player.maxHp * (0.4 + (skillLv-1) * 0.2)) + Math.floor(player.atkRange[1] * (1.0 + (skillLv-1) * 0.5));
    
    // 🌟 風行判定邏輯 (治癒也能連擊！)
    let hits = 1;
    let windMultiplier = 1;
    if (player.windWalkActive) {
        hits = 2;
        windMultiplier = 1 + (player.skillLevels.windWalk * 0.5);
        player.windWalkActive = false;
    }

    let totalHeal = 0;
    for(let i=0; i<hits; i++) {
        let currentHeal = i === 1 ? Math.floor(healAmount * windMultiplier) : healAmount;
        player.hp += currentHeal;
        totalHeal += currentHeal;
    }

    player.skills.healCD = 5; 

    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c;">【風行共鳴】</b> 🌿 生命魔力兩次綻放！獲得 <b style="color:#2ecc71; font-size:1.1em;">${totalHeal}</b> 點巨額護盾！`);
    } else {
        addLog(`🌿 <b style="color:#2ecc71;">大治癒術！</b> 溢出的生命力化為護盾，獲得 <b style="color:#2ecc71;">${totalHeal}</b> 點生命！`);
    }
    
    reduceCooldowns(); 
    monsterTurn(); 
    updateUI();

    const hpFill = document.getElementById('player-hp-fill');
    if (player.hp > player.maxHp && hpFill) {
        hpFill.style.backgroundColor = "#f1c40f"; 
        hpFill.style.width = "100%"; 
        document.getElementById('player-hp').innerText = `🛡️ ${player.hp} / ${player.maxHp}`;
    }
}

function checkBattle() {
    if (currentMonster.hp <= 0) {
        currentMonster.hp = 0;
        if (!player.stats) player.stats = { kills: 0, maxDamage: 0, totalGold: 0 };
        player.stats.kills++;
        player.stats.totalGold += currentMonster.coin;
        if (sounds.kill) sounds.kill.play().catch(e => {});
        if (currentMonster.isTower) {
                addLog(`🗼 <b style="color:#f1c40f; font-size: 1.3em;">恭喜突破無盡之塔 第 ${player.towerFloor} 層！</b>`);
                
                // 爬塔成功獎勵：永久獲得大量屬性！
                let towerBonusAtk = player.towerFloor * 50;
                let towerBonusDef = player.towerFloor * 50;
                player.extraATK += towerBonusAtk;
                player.extraDEF += towerBonusDef;
                
                addLog(`✨ 吸收了本層的虛空精華，永久獲得 <b style="color:#e74c3c;">ATK +${towerBonusAtk}</b>、<b style="color:#3498db;">DEF +${towerBonusDef}</b>！`);
                
                player.towerFloor++; // 層數推進
            }
        else if (currentMonster.isBoss) {
            player.bossDefeatedLevel = player.level; 
            addLog(`<b style='color: #f39c12;'>🎉 難以置信！你擊敗了魔王，獲得了豐厚的獎勵！</b>`);
            const hpFill = document.getElementById('monster-hp-fill');
            if(hpFill) hpFill.style.backgroundColor = "#e74c3c";
        } else {
            addLog(`🏆 擊敗 ${currentMonster.name}！獲得 ${currentMonster.exp} 經驗與 ${currentMonster.coin} 金幣。`);
        }
        
        if (Math.random() < 0.4) {
            let newEquip = rollLoot(); 
            player.inventory.push(newEquip);
            
            if (newEquip.rarity === "Mythic") {
                addLog(`🎊 <b style="color: #f1c40f; font-size: 1.5em; text-shadow: 0 0 5px #f1c40f;">奇蹟降臨！你獲得了傳說中的【${newEquip.name}】！</b> 🎊`);
            } else {
                let color = newEquip.rarity === "Epic" ? "#9b59b6" : 
                            newEquip.rarity === "Rare" ? "#3498db" : 
                            newEquip.rarity === "Uncommon" ? "#2ecc71" : "#bdc3c7";
                let statLog = newEquip.type === 'weapon' ? `攻擊力 +${newEquip.atkBonus}` : `防禦力 +${newEquip.defBonus}`;
                addLog(`🎁 怪物掉落了裝備：<b style="color: ${color};">${newEquip.name} (${statLog})</b>`);
            }
        }
        
        player.exp += currentMonster.exp;
        player.coin += currentMonster.coin;
        
        checkLevelUp();
        saveGame(); 
        
        currentMonster = null;
        document.getElementById('battle-actions').style.display = 'none';
        document.getElementById('explore-btn').style.display = 'inline-block';
        
        const shopContainer = document.getElementById('shop-container');
        if(shopContainer) shopContainer.style.display = 'block';
        
    } else {
        reduceCooldowns();
        monsterTurn();
    }
    updateUI();
}

// 🌟 記錄最高傷害
function recordDamage(dmg) {
    if (!player.stats) player.stats = { kills: 0, maxDamage: 0, totalGold: 0 };
    if (dmg > player.stats.maxDamage) {
        player.stats.maxDamage = dmg;
    }
}

function renderInventory() {
    const weaponList = document.getElementById('inventory-weapons');
    const armorList = document.getElementById('inventory-armors');
    
    // 如果找不到標籤就先退出 (保險機制)
    if (!weaponList || !armorList) return; 

    // 每次更新前先清空畫面
    weaponList.innerHTML = ''; 
    armorList.innerHTML = '';

    let weaponCount = 0;
    let armorCount = 0;

    // 巡視背包裡的所有東西
    player.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        
        let color = "#bdc3c7"; 
        if(item.rarity === 'Uncommon') color = "#2ecc71"; 
        if(item.rarity === 'Rare') color = "#3498db";    
        if(item.rarity === 'Epic') color = "#9b59b6";    
        if(item.rarity === 'Mythic') color = "#f39c12";   

        // 判斷文字顯示 ATK 還是 DEF
        let statText = item.type === 'weapon' ? `ATK +${item.atkBonus}` : `DEF +${item.defBonus}`;

        // 🌟🌟🌟 新增按鈕邏輯：判斷這件裝備是否「正在穿著」 🌟🌟🌟
        let isEquipped = false;
        
        // 檢查武器槽
        if (item.type === 'weapon' && player.equiptment.weapon === item) {
            isEquipped = true;
        }
        // 檢查防具槽
        if (item.type === 'armor' && player.equiptment.armor === item) {
            isEquipped = true;
        }

        let equipActionButton;
        if (isEquipped) {
            // 如果正在穿，顯示「脫下」按鈕，功能指向 unequipItem，並加上綠色光芒樣式
            itemDiv.style.border = `2px solid ${color}`; // 給穿著的裝備加上原本稀有度的邊框
            itemDiv.style.boxShadow = `0 0 10px ${color}`; // 給穿著的裝備加上光芒

            // 🌟🌟🌟 使用 unequipItem 脫下按鈕 🌟🌟🌟
            equipActionButton = `<button class="btn-unequip" style="background-color: #f39c12;" onclick="unequipItem('${item.type}')">脫下</button>`;
        } else {
            // 如果沒在穿，顯示原本的「裝備」按鈕，指向 equipItem
            equipActionButton = `<button class="btn-equip" onclick="equipItem(${index})">裝備</button>`;
        }
        // 🌟🌟🌟 按鈕邏輯結束 🌟🌟🌟
        let currentLv = item.enhanceLevel || 0;
        let enhanceText = currentLv > 0 ? ` <span style="color: #f1c40f; text-shadow: 0 0 5px #f1c40f;">+${currentLv}</span>` : "";
        let itemNameDisplay = `${item.name}${enhanceText}`;

        let successRate = ((10 / (10 + currentLv)) * 100).toFixed(1);

        // 🌟 基本的 1 次強化按鈕
        let enhanceBtnHTML = `<button style="background-color: #8e44ad; color: white; padding: 2px 5px; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;" onclick="enhanceItem(${index})">
            ➕ 強化 (1石 | ${successRate}%)
        </button>`;

        // 🌟🌟🌟 新增：如果強化石大於等於 100 顆，才額外顯示「百連強化」按鈕！ 🌟🌟🌟
        if (player.enhanceStones >= 100) {
            enhanceBtnHTML += `<button style="background-color: #e74c3c; color: white; padding: 2px 5px; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;" onclick="enhanceItem100(${index})">
                🔥 百連 (100石)
            </button>`;
        }

        itemDiv.innerHTML = `
            <span style="color: ${color}; font-weight: bold;">${itemNameDisplay} (${statText})</span>
            <div style="margin-top: 5px;">
                ${equipActionButton} 
                <button class="btn-dismantle" onclick="dismantleItem(${index})">分解</button>
                ${enhanceBtnHTML}
            </div>
        `;

        // 神奇分類帽：你是武器就去武器庫，是防具就去防具庫！
        if (item.type === 'weapon' || item.atkBonus !== undefined) {
            weaponList.appendChild(itemDiv);
            weaponCount++;
        } else if (item.type === 'armor' || item.defBonus !== undefined) {
            armorList.appendChild(itemDiv);
            armorCount++;
        } 
    });

    // 如果分類裡面沒東西，顯示一段提示文字
    if (weaponCount === 0) {
        weaponList.innerHTML = '<p style="color: #666; font-size: 0.9em; margin: 0;">(武器庫空空如也...)</p>';
    }
    if (armorCount === 0) {
        armorList.innerHTML = '<p style="color: #666; font-size: 0.9em; margin: 0;">(防具庫空空如也...)</p>';
    }
}

// --- 🔥 裝備百連強化系統 (高速結算版) ---
function enhanceItem100(index) {
    const item = player.inventory[index];
    if (!item) return;

    if (player.enhanceStones < 100) {
        addLog(`❌ 強化石不足！百連強化需要 100 顆強化石。`);
        return;
    }

    // 一口氣扣除 100 顆石頭
    player.enhanceStones -= 100;

    let startLv = item.enhanceLevel || 0;
    let successCount = 0;
    let totalBoost = 0;

    // 🌟 在背景瞬間跑 100 次強化判定
    for (let i = 0; i < 100; i++) {
        let currentLv = item.enhanceLevel || 0;
        
        // 每次強化時，系統都會重新計算當下等級的成功率
        let successRate = (10 / (10 + currentLv)) * 100; 
        let roll = Math.random() * 100;
        
        if (roll <= successRate) {
            successCount++; // 記錄成功次數
            item.enhanceLevel = currentLv + 1;

            // 計算這次成功加了多少數值
            let boost = 0;
            if (item.type === 'weapon') {
                boost = Math.floor(item.atkBonus * 0.1) + 50;
                item.atkBonus += boost;
            } else {
                boost = Math.floor(item.defBonus * 0.1) + 50;
                item.defBonus += boost;
            }
            totalBoost += boost; // 累加總成長數值
        }
    }

    let endLv = item.enhanceLevel || 0;

    // --- 📊 百連結算超華麗廣播 ---
    if (successCount > 0) {
        let statName = item.type === 'weapon' ? '攻擊力' : '防禦力';
        let statColor = item.type === 'weapon' ? '#e74c3c' : '#3498db';
        
        addLog(`🔥 <b style="color:#e74c3c; font-size:1.1em;">百連強化大結算！</b> 【${item.name}】在火爐中千錘百鍊，成功了 <b style="color:#f1c40f;">${successCount}</b> 次！`);
        addLog(`✨ 等級從 +${startLv} 飆升至 <b style="color:#f1c40f; font-size:1.2em;">+${endLv}</b>！(${statName}總共暴增了 <b style="color:${statColor}; font-size:1.2em;">${totalBoost.toLocaleString()}</b>)`);
    } else {
        // 萬一 100 次全失敗的超慘非洲人廣播
        addLog(`💥 <b style="color:#7f8c8d;">百連強化大暴死...</b> 砸了 100 顆強化石，【${item.name}】竟然連一次都沒成功... (維持 +${startLv})`);
    }

    updateUI();
    renderInventory();
    saveGame();
}

// --- 🔨 無限裝備強化系統 (機率檢定版) ---
// --- 🔨 無限裝備強化系統 (平滑漸進機率版) ---
function enhanceItem(index) {
    const item = player.inventory[index];
    if (!item) return;

    if (player.enhanceStones < 1) {
        addLog(`❌ 強化石不足！每次強化需要 1 顆強化石。`);
        return;
    }

    let currentLv = item.enhanceLevel || 0;
    
    // 🌟 終極平滑公式：等級越高，機率越低，但永遠不會歸零
    let successRate = (1 / (1 + currentLv)) * 100; 

    // 扣除 1 顆強化石
    player.enhanceStones -= 1;

    // 🎲 產生 0~100 的亂數，並檢查是否落在成功率內
    let roll = Math.random() * 100;
    
    if (roll <= successRate) {
        // ✅ 強化成功
        item.enhanceLevel = currentLv + 1;

        if (item.type === 'weapon') {
            let boost = Math.floor(item.atkBonus * 0.1) + 50;
            item.atkBonus += boost;
            addLog(`🔨 <b style="color:#f1c40f; font-size:1.1em;">叮！強化成功！</b> 【${item.name}】發出耀眼光芒，達到了 <b style="color:#f1c40f;">+${item.enhanceLevel}</b>！(攻擊力爆增 <b style="color:#e74c3c;">${boost}</b>)`);
        } else {
            let boost = Math.floor(item.defBonus * 0.1) + 50;
            item.defBonus += boost;
            addLog(`🔨 <b style="color:#f1c40f; font-size:1.1em;">叮！強化成功！</b> 【${item.name}】變得更加堅不可摧，達到了 <b style="color:#f1c40f;">+${item.enhanceLevel}</b>！(防禦力爆增 <b style="color:#3498db;">${boost}</b>)`);
        }
    } else {
        // ❌ 強化失敗
        addLog(`💥 <b style="color:#7f8c8d;">強化失敗...</b> 【${item.name}】發出一陣黑煙，強化石碎裂了。(維持 +${currentLv})`);
    }

    updateUI();
    renderInventory();
    saveGame();
}

function reduceCooldowns() {
    if (player.skills.fireballCD > 0) player.skills.fireballCD--;
    if (player.skills.lightningCD > 0) player.skills.lightningCD--;
    if (player.skills.healCD > 0) player.skills.healCD--;
    if (player.skills.windWalkCD > 0) player.skills.windWalkCD--;
    if (player.skills.holyLightCD > 0) player.skills.holyLightCD--;
    if (player.skills.blackHoleCD > 0) player.skills.blackHoleCD--;
}

function renderAreaSelector() {
    const container = document.getElementById('area-selector-container');
    const select = document.getElementById('area-select');
    if (!container || !select) return;

    if (player.level >= 10) {
        container.style.display = 'block';
        select.innerHTML = ''; 

        areas.forEach((area, index) => {
            if (player.level >= area.reqLevel) {
                const option = document.createElement('option');
                option.value = index;
                option.innerText = `${area.name} (Lv.${area.reqLevel}+)`;
                if (player.currentArea === index) option.selected = true;
                select.appendChild(option);
            }
        });
    } else {
        container.style.display = 'none';
    }
}

function changeArea() {
    const select = document.getElementById('area-select');
    player.currentArea = parseInt(select.value);
    addLog(`🗺️ 你收拾行囊，前往了新的區域：<b style="color:#3498db;">${areas[player.currentArea].name}</b>！`);
    saveGame();
    updateUI();
}

function revive() {
    if (player.protectionAmulet > 0) {
        player.protectionAmulet--;
        addLog("✨ <b style='color:#f1c40f;'>【守護十字架】發出耀眼光芒碎裂了！你免除了死亡懲罰並滿血復活！</b>");
    } else {
        if (player.level > 1) {
            let levelsToLose = 1 + Math.floor(player.level / 5);
            if (player.level - levelsToLose < 1) levelsToLose = player.level - 1;

            for (let i = 0; i < levelsToLose; i++) {
                player.level--;
                player.maxHp -= 20; 
                player.baseAtk[0] -= 2;
                player.baseAtk[1] -= 4;
            }
            
            player.nextLevelExp = Math.floor(100 * Math.pow(1.5, player.level - 1));
            player.exp = 0; 
            
            let coinLossRate = Math.min(0.5, player.level * 0.02);
            let lostCoins = Math.floor(player.coin * coinLossRate);
            player.coin -= lostCoins;

            addLog(`💀 <b style='color:red;'>你遭受了嚴重的死亡懲罰！失去了 ${levelsToLose} 個等級與 ${lostCoins} 枚金幣...</b>`);
        } else {
            player.exp = 0;
            let lostCoins = Math.floor(player.coin * 0.5);
            player.coin -= lostCoins;
            addLog(`💀 <b style='color:red;'>你復活了。作為代價你失去了所有的經驗與 ${lostCoins} 枚金幣。</b>`);
        }
    }

    player.hp = player.maxHp;       
    currentMonster = null;          
    player.skills.fireballCD = 0;   
    player.skills.lightningCD = 0;
    player.skills.healCD = 0;
    player.skills.windWalkCD = 0;
    player.windWalkActive = false;

    const exploreBtn = document.getElementById('explore-btn');
    exploreBtn.innerText = `🧭 開始探險 `;
    exploreBtn.style.backgroundColor = ""; 
    exploreBtn.onclick = explore; 

    const shopContainer = document.getElementById('shop-container');
    if(shopContainer) shopContainer.style.display = 'block';

    updateUI(); 
    saveGame(); 
}

// --- 🔨 裝備分解系統 ---
function equipItem(index) {
    const item = player.inventory[index];
    if (!item) return;

    if (item.type === 'weapon') {
        player.equiptment.weapon = item;
        addLog(`⚔️ 裝備了 【${item.name}】，攻擊力提升了 ${item.atkBonus}！`);
    } else if (item.type === 'armor') {
        player.equiptment.armor = item;
        addLog(`🛡️ 穿上了 【${item.name}】，防禦力提升了 ${item.defBonus}！`);
    }

    updateUI(); 
    saveGame();
}

// 🌟🌟🌟 全新脫裝備函數 🌟🌟🌟
function unequipItem(type) {
    if (type === 'weapon') {
        if (player.equiptment.weapon) {
            const item = player.equiptment.weapon;
            // 由於 calculateTotalAtk 是動態計算，只要把 slot 清空即可
            player.equiptment.weapon = null; 
            addLog(`➖ 你卸下了手中握著的 【${item.name}】。`);
        }
    } else if (type === 'armor') {
        if (player.equiptment.armor) {
            const item = player.equiptment.armor;
            // 由於 updateUI 是動態計算總防禦，只要把 slot 清空即可
            player.equiptment.armor = null; 
            addLog(`➖ 你脫下了身上穿著的 【${item.name}】。`);
        }
    }

    // 更新畫面與存檔
    updateUI();
    saveGame();
}
function dismantleItem(index) {
    const item = player.inventory[index];
    if (!item) return;

    // 檢查是否正在裝備中，如果是，先強制脫下
    if (player.equiptment.weapon === item) {
        player.equiptment.weapon = null;
        addLog("⚠️ 你分解了手中正在裝備的武器！");
    } else if (player.equiptment.armor === item) {
        player.equiptment.armor = null;
        addLog("⚠️ 你分解了身上穿著的防具！");
    }

    // 🌟 全新分解公式：基礎值 × (玩家等級 / 2)
    let baseValue = 1; 
    if (item.rarity === 'Uncommon') baseValue = 3;
    if (item.rarity === 'Rare') baseValue = 5;
    if (item.rarity === 'Epic') baseValue = 15;
    if (item.rarity === 'Mythic') baseValue = 50;

    let upgradeValue = baseValue * Math.max(1, Math.floor(player.level / 2));

// 找到 dismantleItem 裡的這段並替換：
    if (item.type === 'weapon') {
        player.extraATK += upgradeValue; 
        addLog(`🔨 <b style="color:#e67e22;">分解成功！</b> 【${item.name}】化為純粹的力量，永久攻擊力 +${upgradeValue}！`);
    } else {
        // 🌟 防具分解強化：同時增加防禦與大量生命值
        player.extraDEF += upgradeValue; 
        let hpGain = upgradeValue * 25; 
        player.maxHp += hpGain;
        player.hp += hpGain; // 順便把增加的血量補滿
        
        addLog(`🔨 <b style="color:#2ecc71;">分解成功！</b> 【${item.name}】化為鐵壁與生命精華，永久防禦力 +${upgradeValue}、最大生命 +<b style="color:#e74c3c;">${hpGain}</b>！`);
    }

    // 🌟🌟🌟 最關鍵的這三行：刪除物品、刷新背包、存檔 🌟🌟🌟
    player.inventory.splice(index, 1); 
    renderInventory(); 
    updateUI();
    saveGame();
}
function rollGacha(times) {
    let costPerPull = 1000 * player.level; 
    let totalCost = costPerPull * times;

    if (player.coin < totalCost) {
        addLog(`❌ 金幣不足！轉蛋 ${times} 次需要 ${totalCost} 金幣。`);
        return;
    }

    player.coin -= totalCost;
    
    let results = [];
    let missCount = 0; 
    
    // 🌟 用來統計自動分解獲得的屬性
    let autoAtkGained = 0;
    let autoDefGained = 0;
    let autoHpGained = 0
    let dismantleCount = 0;
    
    for (let i = 0; i < times; i++) {
        let roll = Math.random();
        let rarity, minStat, maxStat;

        if (roll < 0.005) { rarity = "Mythic"; minStat = 200; maxStat = 500; } 
        else if (roll < 0.055) { rarity = "Epic"; minStat = 50; maxStat = 100; } 
        else if (roll < 0.205) { rarity = "Rare"; minStat = 20; maxStat = 49; } 
        else if (roll < 0.455) { rarity = "Uncommon"; minStat = 10; maxStat = 19; } 
        else if (roll < 0.755) { rarity = "Common"; minStat = 1; maxStat = 9; } 
        else { 
            missCount++;
            continue; 
        }

        let equip = generateRandomEquip(rarity, minStat, maxStat);

        // 🌟 自動分解邏輯攔截！
        if (player.autoDismantle && (rarity === 'Common' || rarity === 'Uncommon' || rarity === 'Rare')) {
            let baseValue = 1; 
            if (rarity === 'Uncommon') baseValue = 3;
            if (rarity === 'Rare') baseValue = 5;

            // 🌟 同步套用等級加成公式
            let upgradeValue = baseValue * Math.max(1, Math.floor(player.level / 2));

            if (equip.type === 'weapon') {
                player.extraATK += upgradeValue;
                autoAtkGained += upgradeValue;
            } else {
                player.extraDEF += upgradeValue;
                autoDefGained += upgradeValue;
                
                // 🌟 新增：自動分解防具加血量
                let hpGain = upgradeValue * 25;
                player.maxHp += hpGain;
                player.hp += hpGain;
                autoHpGained += hpGain;
            }
            dismantleCount++;
        } else {
            // 如果沒開自動分解，或是抽到 Epic/Mythic 神裝，就乖乖放進背包
            player.inventory.push(equip); 
            results.push(equip);
        }
        updateUI();
    }

    // --- 廣播抽獎與分解結果 ---
    if (times === 1) {
        if (missCount === 1) {
            addLog(`💸 花費 ${totalCost} 金幣轉蛋... <span style="color:#7f8c8d; font-weight:bold;">【謝謝惠顧】 錢被吃掉了！</span>`);
        } else if (dismantleCount === 1) {
            let statText = autoAtkGained > 0 
                ? `攻擊力 +${autoAtkGained}` 
                : `<b style="color:#3498db;">防禦力 +${autoDefGained}</b>、<b style="color:#2ecc71;">最大生命 +${autoHpGained}</b>`;
            addLog(`♻️ 抽到了低階裝備，已自動分解轉化為永久 <b style="color:#2ecc71;">${statText}</b>！`);
        } else {
            let color = getRarityColor(results[0].rarity);
            addLog(`🎰 花費 ${totalCost} 金幣轉蛋，獲得了：<b style="color:${color};">${results[0].name}</b>！`);
        }
    } else {
        // 10 連抽結算
        let logMsg = `🎰 花費 ${totalCost} 金幣進行了 ${times} 連抽！`;
        if (missCount > 0) logMsg += ` (其中 <b style="color:#e74c3c;">${missCount}</b> 次【謝謝惠顧】)`;
        addLog(logMsg);
        
        // 播報自動分解結算
        if (dismantleCount > 0) {
            addLog(`♻️ 系統已將 <b style="color:#e67e22;">${dismantleCount}</b> 件低階裝備自動提煉，永久獲得：<b style="color:#e74c3c;">ATK +${autoAtkGained}</b>、<b style="color:#3498db;">DEF +${autoDefGained}</b>、<b style="color:#2ecc71;">血量 +${autoHpGained}</b>！`);
        }

        // 播報神裝
        let rareDrops = results.filter(e => e.rarity === 'Epic' || e.rarity === 'Mythic');
        if (rareDrops.length > 0) {
            let rareNames = rareDrops.map(e => `<b style="color:${getRarityColor(e.rarity)}">${e.name}</b>`).join("、");
            addLog(`🌟 <b style="color:#f1c40f; font-size: 1.1em;">歐氣爆發！</b> 獲得了稀有大獎：${rareNames}！`);
        }
    }

    updateUI(); 
    renderInventory(); 
    saveGame();
}
// --- 🎰 轉蛋 MAX 系統 (含防卡死安全鎖) ---
function rollGachaMax() {
    let costPerPull = 1000 * player.level; 
    let maxAffordablePulls = Math.floor(player.coin / costPerPull); // 計算你現在的錢能抽幾次

    if (maxAffordablePulls <= 0) {
        addLog(`❌ 金幣不足！轉蛋 1 次需要 ${costPerPull} 金幣。`);
        return;
    }

    // 🌟 終極防護鎖：就算你有錢抽一億次，為了不讓瀏覽器崩潰，一次最多只執行 1000 抽！
    let actualPulls = Math.min(maxAffordablePulls, 1000); 

    // 呼叫原本寫好的轉蛋邏輯
    rollGacha(actualPulls);
}
// --- ♻️ 切換自動分解設定 ---
function toggleAutoDismantle() {
    const cb = document.getElementById('auto-dismantle-cb');
    if (cb) {
        player.autoDismantle = cb.checked;
        saveGame();
    }
}
// --- 🌌 轉生系統 ---
function performRebirth() {
    if (player.level < 1000) {
        addLog("❌ 你的境界還不夠，需要達到 1000 級才能轉生！");
        return;
    }
    
    if (!confirm("⚠️ 警告：這將會重置你的等級、屬性、裝備、金幣與護符（保留技能解鎖狀態）。但你會獲得永久的成長倍率加成！確定要轉生嗎？")) {
        return;
    }
    if (player.maxTowerFloor === undefined) player.maxTowerFloor = 1;
    if (player.towerFloor > player.maxTowerFloor) {
        player.maxTowerFloor = player.towerFloor;
    }
    // 🌟 1. 轉生次數 +1
    player.rebirthCount++;
    
    // 🌟 2. 殘酷地重置一切 (保留技能、轉生次數、自動分解設定)
    let rebirthMultiplier = 1 + player.rebirthCount; // 1轉=2倍基礎, 2轉=3倍基礎...
    player.towerFloor = 1;
    player.level = 1;
    player.exp = 0;
    player.nextLevelExp = 100;
    
    // 轉生後的 1 級，基礎能力直接吃倍率！
    player.maxHp = 100 * rebirthMultiplier; 
    player.hp = player.maxHp;
    player.baseAtk = [5 * rebirthMultiplier, 12 * rebirthMultiplier]; 
    player.baseDef = 0;
    player.extraATK = 0;
    player.extraDEF = 0;
    player.enhanceStones /=2;
    player.coin = 0;
    player.expAmulet = 0;
    player.goldAmulet = 0;
    
    player.inventory = [];
    player.equiptment = { weapon: null, armor: null };
    
    // 重置技能冷卻
    for (let key in player.skills) player.skills[key] = 0;
    // 找到這行並替換：
    player.skillLevels = { fireball: 1, lightning: 1, heal: 1, windWalk: 1, holyLight: 1, blackHole: 1 };
    player.currentArea = 0; 
    player.bossDefeatedLevel = 0;
    // 🌟 3. 世界廣播
    addLog(`🌌 <b style="color:#8e44ad; font-size: 1.5em;">宇宙轉生發動！</b>`);
    addLog(`✨ 帶著前世的記憶，你迎來了第 <b style="color:#f1c40f;">${player.rebirthCount}</b> 次新生！你的基礎潛能獲得了永久提升！`);
    
    updateUI();
    renderInventory();
    saveGame();
}
// --- 🗼 虛空無盡之塔挑戰 ---
// --- 🗼 虛空無盡之塔挑戰 (修復破圖與按鈕問題) ---
function exploreTower() {
    if (currentMonster) return;
    if (player.hp <= 0) {
        addLog("❌ 你已經重傷，請先使用治癒術恢復體力！");
        return;
    }


    let floor = player.towerFloor;
    
    // 塔內怪物公式
    let mHp = Math.floor(500000 * Math.pow(1.5, floor)); 
    let mAtk = Math.floor(20000 * Math.pow(1.2, floor));
    let def = Math.floor(1000 * Math.pow(1.15, floor));
    let mExp = 0;
    let mCoin = 0;

    // 🌟 1. 補上 image 屬性，防禦破圖 (這裡幫你找了一個霸氣的惡魔圖示)
    currentMonster = {
        name: `🗼 虛空守衛 (第${floor}層)`,
        maxHp: mHp,
        hp: mHp,
        atk: [mAtk, mAtk ],
        def: def,
        exp: mExp,
        coin: mCoin,
        isTower: true,
        image: "images/void_guard.jpg" 
    };

    // 🌟 2. 強制切換戰鬥介面 (隱藏探險按鈕，顯示技能按鈕)
    let exploreBtn = document.getElementById('explore-btn'); // 你的探險按鈕 ID
    let battleActions = document.getElementById('battle-actions'); // 你的戰鬥按鈕區塊 ID
    
    if (exploreBtn) exploreBtn.style.display = 'none';
    if (battleActions) battleActions.style.display = 'flex'; // 或 'block' 依你原本的設定

    // 🌟 3. 強制更新怪物名稱與圖片 UI (防止畫面卡在「準備探險...」)
    let monsterNameEl = document.getElementById('monster-name');
    let monsterImgEl = document.getElementById('monster-image');
    if (monsterNameEl) monsterNameEl.innerText = currentMonster.name;
    if (monsterImgEl) monsterImgEl.src = currentMonster.image;

    addLog(`<div style="border-top: 1px dashed #e74c3c; margin: 10px 0;"></div>`);
    addLog(`🗼 <b style="color:#e74c3c; font-size: 1.2em;">你踏入了無盡之塔 第 ${floor} 層！</b>`);
    addLog(`💀 恐怖的 ${currentMonster.name} 降臨了！(血量: ${mHp}, 攻擊力: ${mAtk})`);
    
    updateUI();
}
function deleteSave() {
    if (confirm("確定要刪除所有冒險進度嗎？這無法還原！")) {
        localStorage.removeItem('myRpgSave');
        location.reload(); 
    }
}
// ==========================================
// 🤖 AI 全自動戰鬥系統核心
// ==========================================
let autoBattleInterval = null;
let isAutoBattling = false;

function toggleAutoBattle() {
    isAutoBattling = !isAutoBattling;
    let btn = document.getElementById('auto-battle-btn');
    
    if (isAutoBattling) {
        // 啟動狀態
        btn.innerText = "🤖 自動戰鬥：ON (運作中)";
        btn.style.backgroundColor = "#2ecc71"; // 變成亮綠色
        btn.style.borderColor = "#27ae60";
        addLog("🤖 <b style='color:#2ecc71; font-size: 1.2em;'>系統接管：AI 全自動戰鬥已啟動！</b>");
        
        // 🌟 設定 AI 動作頻率 (1000 = 1秒，可以改成 500 變兩倍速！)
        autoBattleInterval = setInterval(autoBattleLogic, 1000); 
    } else {
        // 關閉狀態
        btn.innerText = "🤖 自動戰鬥：OFF";
        btn.style.backgroundColor = "#34495e";
        btn.style.borderColor = "#2c3e50";
        addLog("🤖 系統提示：已解除自動控制，切換為手動模式。");
        
        clearInterval(autoBattleInterval); // 停止計時器
    }
}

// --- 🧠 AI 戰鬥邏輯判斷 (Priority Queue) ---
function autoBattleLogic() {
    // 💀 1. 死亡判定：如果死了，自動幫你按復活！
    if (player.hp <= 0) {
        revive();
        return;
    }

    // 🏕️ 2. 尋找獵物：如果不在戰鬥中，自動按下探險
    if (!currentMonster) {
        // 💡 如果你想讓它全自動爬塔，就把 explore() 改成 exploreTower()
        explore(); 
        return;
    }

    // ⚔️ 3. 戰鬥決策樹 (依照優先級施放技能)
    
    // 🛡️ 優先級 A：保命第一！血量低於 40% 且治癒術可用，立刻補血
    if (player.hp < player.maxHp * 50.0 && player.unlockedSkills.heal && player.skills.healCD === 0) {
        useHeal();
        return; 
    }
    
    // 🌪️ 優先級 B：開 Buff！如果有風行且沒在 CD，先套上狀態
    if (player.unlockedSkills.windWalk && player.skills.windWalkCD === 0 && !player.windWalkActive) {
        useWindWalk();
        return;
    }

    // 🌌 優先級 C：毀滅打擊！有黑洞丟黑洞，有聖光丟聖光
    if (player.unlockedSkills.blackHole && player.skills.blackHoleCD === 0) {
        useBlackHole();
        return;
    }
    if (player.unlockedSkills.holyLight && player.skills.holyLightCD === 0) {
        useHolyLight();
        return;
    }

    // ⚡🔥 優先級 D：常規輸出
    if (player.unlockedSkills.lightning && player.skills.lightningCD === 0) {
        useLightning();
        return;
    }
    if (player.unlockedSkills.fireball && player.skills.fireballCD === 0) {
        useFireball();
        return;
    }

    // 🗡️ 優先級 E：招式全在冷卻中，平A普通攻擊
    attack();
}
// --- 遊戲啟動 ---
loadGame(); 
updateUI();