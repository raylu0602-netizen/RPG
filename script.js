let player = {
    hp: 100, maxHp: 100, coin: 0, level: 1, exp: 0, nextLevelExp: 100,
    atkRange: [5, 12],
    
    // --- 技能相關 ---
    skills: { fireballCD: 0, lightningCD: 0, healCD: 0 },
    unlockedSkills: { fireball: true, lightning: false, heal: false ,windWalk: false }, 
    skillLevels: { fireball: 1, lightning: 1, heal: 1 ,windWalk: 1}, 
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
    currentArea: 0
};

// --- 🗺️ 世界地圖與怪物設定 ---
const areas = [
    {
        id: 0,
        name: "幽暗森林",
        reqLevel: 1, // 進入需求等級
        monsters: [
            { name: "綠色史萊姆", hp: 20, maxHp: 20, image: "images/slime.png", atk: [3, 6], def: 1,exp: 25, coin: 25 },
            { name: "森林哥布林", hp: 40, maxHp: 40, image: "images/goblin.jpg", atk: [6, 12], def: 2,exp: 50, coin: 50 },
            { name: "地獄小惡魔", hp: 60, maxHp: 60, image: "images/imp.png", atk: [12, 18], def: 5,exp: 75, coin: 75 }
        ],
        boss: {
            name: "深淵魔龍", hp: 160, maxHp: 160, image: "images/boss.jpg", atk: [15, 25], def: 10,exp: 150, coin: 150, isBoss: true 
        }
    },
    {
        id: 1,
        name: "烈焰火山",
        reqLevel: 10, // 🌟 10 級才能解鎖！
        monsters: [
            { name: "熔岩犬", hp: 120, maxHp: 120, image: "images/hound.png", atk: [20, 35], def: 5,exp: 150, coin: 130 },
            { name: "火焰精靈", hp: 60, maxHp: 60, image: "images/fire_spirit.png", atk: [30, 45], def: 0,exp: 100, coin: 100 },
            { name: "火山岩怪", hp: 180, maxHp: 180, image: "images/golem.png", atk: [15, 25], def: 10,exp: 200, coin: 180 }
        ],
        boss: {
            name: "灰燼鳳凰", hp: 400, maxHp: 400, image: "images/fire_boss.png", atk: [40, 60], def: 20,exp: 350, coin: 450, isBoss: true 
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
        let cost = 200 + (player.expAmulet * 150);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.expAmulet += 1; 
            let currentBonus = player.expAmulet * 10;
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
        let cost = 200 + (player.skillLevels.fireball * 150);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.fireball++;
            addLog(`🔥 花費了 ${cost} 金幣，【火球術】升級到了 <b style="color:#e74c3c;">Lv.${player.skillLevels.fireball}</b>！傷害倍率提升！`);
        } else {
            addLog(`❌ 金幣不足，升級火球術需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'upgrade_lightning') {
        let cost = 300 + (player.skillLevels.lightning * 200);
        if (player.coin >= cost) {
            player.coin -= cost;
            player.skillLevels.lightning++;
            addLog(`⚡ 花費了 ${cost} 金幣，【閃電斬】升級到了 <b style="color:#9b59b6;">Lv.${player.skillLevels.lightning}</b>！爆發力更恐怖了！`);
        } else {
            addLog(`❌ 金幣不足，升級閃電斬需要 ${cost} 金幣。`);
        }
    }
    else if (item === 'upgrade_heal') {
        let cost = 250 + (player.skillLevels.heal * 150);
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
            let nextCost = 200 + ((currentLv + levelsGained) * 150);
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
            let nextCost = 300 + ((currentLv + levelsGained) * 200);
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
            let currentBonus = player.expAmulet * 10;
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
    
    // 🌟🌟🌟 新增：針對「風行」技能的舊存檔保護機制 🌟🌟🌟
    if (player.skills.windWalkCD === undefined) player.skills.windWalkCD = 0;
    if (player.unlockedSkills.windWalk === undefined) player.unlockedSkills.windWalk = false;
    if (player.skillLevels.windWalk === undefined) player.skillLevels.windWalk = 1;
    if (player.windWalkActive === undefined) player.windWalkActive = false;
    // 🌟🌟🌟 新增結束 🌟🌟🌟

    if (player.currentArea === undefined) player.currentArea = 0;
    player.atkRange = calculateTotalAtk();
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
        let cost = 200 + (player.expAmulet * 150); 
        let bonus = player.expAmulet * 10; 
        amuletText.innerText = `✨ 經驗護符 (+${bonus}% 經驗) (${cost}g)`;
    }

    const goldAmuletText = document.getElementById('gold-amulet-text');
    if (goldAmuletText) {
        let cost = 200 + (player.goldAmulet * 150); 
        let bonus = player.goldAmulet * 5; 
        goldAmuletText.innerText = `🪙 金幣護符 (+${bonus}% 金幣) (${cost}g)`;
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

    const shopLt = document.getElementById('shop-lightning');
    if (shopLt) shopLt.style.display = player.unlockedSkills.lightning ? 'none' : 'flex';
    const shopHl = document.getElementById('shop-heal');
    if (shopHl) shopHl.style.display = player.unlockedSkills.heal ? 'none' : 'flex';

    const imgElement = document.getElementById('monster-img');
    const placeholder = document.getElementById('placeholder-text');
    
    if (currentMonster) {
        document.getElementById('monster-hp').innerText = `${currentMonster.hp} / ${currentMonster.maxHp}`;
        document.getElementById('monster-hp-fill').style.width = (currentMonster.hp / currentMonster.maxHp * 100) + "%";
        if(imgElement) {
            imgElement.src = currentMonster.image;
            imgElement.style.display = 'block';
        }
        if(placeholder) placeholder.style.display = 'none';
    } else {
        document.getElementById('monster-hp').innerText = "休息中";
        document.getElementById('monster-hp-fill').style.width = "0%";
        if(imgElement) imgElement.style.display = 'none';
        if(placeholder) placeholder.style.display = 'block';
    }

    const exploreBtn = document.getElementById('explore-btn');
    if(exploreBtn && currentMonster === null && player.hp > 0) {
        exploreBtn.innerText = `🧭 開始探險 (💰 ${player.coin})`;
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
        player.maxHp += 20;
        
        if (player.hp < player.maxHp) {
            player.hp = player.maxHp; 
        } else {
            player.hp += 20; 
        }

        player.baseAtk[0] += 2;
        player.baseAtk[1] += 4;
        player.nextLevelExp = Math.floor(player.nextLevelExp * 1.2);
        
        addLog(`<b style="color: #f1c40f;">✨ 恭喜升級！目前等級：LV.${player.level}</b>`);
        checkLevelUp(); 
    }
}

function explore() {
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

        let hpMultiplier = 1 + (player.level - 1) * 0.3 + Math.pow(player.level/5,2);
        let expMultiplier = Math.pow(1.1, player.level - 1);
        let atkMultiplier = 1 + (player.level - 1) * 0.25;
        if(player.level>100) {
            atkMultiplier = 5 + Math.pow(player.level - 20, 0.5) * 0.1;
            expMultiplier *= Math.pow(1.2, player.level - 100);
            }
        let defMultiplier =  Math.pow(1.1, player.level - 1);
        currentMonster.maxHp = Math.floor(currentMonster.maxHp * hpMultiplier);
        currentMonster.hp = currentMonster.maxHp; 
        currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
        currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
        currentMonster.def = Math.floor((currentMonster.def || 0) * defMultiplier);
        
        let expBonusRate = 1 + (player.expAmulet * 0.1); 
        currentMonster.exp = Math.floor(currentMonster.exp * expMultiplier * expBonusRate);
        let goldBonusRate = 1 + (player.goldAmulet * 0.05); 
        currentMonster.coin = Math.floor(currentMonster.coin * expMultiplier * goldBonusRate);

        currentMonster.name = `Lv.${player.level} ${currentMonster.name}`;

        addLog(`⚠️ 警告！你遭遇了 <b>${currentMonster.name}</b>！`);
        
        document.getElementById('battle-actions').style.display = 'inline-block';
        document.getElementById('explore-btn').style.display = 'none';
    } else {
        let baseFound = Math.floor(Math.random() * 10) + 5;
        let finalFound = Math.floor(baseFound * (1 + (player.level - 1) * 0.2));
        let goldBonusRate = 1 + (player.goldAmulet * 0.05);
        finalFound = Math.floor(finalFound * goldBonusRate);
        
        player.coin += finalFound;
        addLog(`💰 你在路邊撿到了 ${finalFound} 枚金幣！`);
        saveGame();
    }
    updateUI();
}

function spawnBoss() {
    addLog("<b style='color: red; font-size: 1.2em;'>🚨 警告！你驚動了強大的領域領主！ 🚨</b>");
    
    const currentAreaBoss = areas[player.currentArea].boss;
    currentMonster = { ...currentAreaBoss };
    currentMonster.atk = [...currentAreaBoss.atk];
    let bossexpMultiplier=Math.pow(1.15, player.level - 1);
    let bossMultiplier = Math.pow(2.2,player.level/5); 
    let atkMultiplier = 1 + (player.level - 1) * 0.5;
    if(player.level>100) {
        bossexpMultiplier = Math.pow(1.15, 100)*Math.pow(1.2, player.level - 100);
        atkMultiplier *= Math.pow(1.1, player.level-100) ;
    }
    let defMultiplier =  Math.pow(2, player.level /5);
    currentMonster.maxHp = Math.floor(currentMonster.maxHp * bossMultiplier);
    currentMonster.hp = currentMonster.maxHp;
    currentMonster.def = Math.floor((currentMonster.def || 0) * defMultiplier);
    

    currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
    currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
    let expBonusRate = 1 + ((player.expAmulet || 0) * 0.1);
    currentMonster.exp = Math.floor(currentMonster.exp * bossexpMultiplier * expBonusRate);
    let goldBonusRateBoss = 1 + ((player.goldAmulet || 0) * 0.05);
    currentMonster.coin = Math.floor(currentMonster.coin * bossexpMultiplier * goldBonusRateBoss);
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
    // 燃燒傷害：2% 最大血量 (對付高血量魔王神技) + 技能等級的固定傷害
    currentMonster.burnDmg = Math.floor(currentMonster.maxHp * (0.01+(skillLv * 0.01)))
    player.skills.fireballCD = 4;
    
    if (hits === 2) {
        addLog(`🌪️ <b style="color:#1abc9c;">【風行雙星】</b> 🔥 兩顆火球接連轟炸！造成驚人的 <b style="color:#e74c3c; font-size:1.1em;">${totalFinalDmg}</b> 總傷害！(抵擋 ${totalBlocked} 點)`);
    } else {
        addLog(`🔥 <b style="color:#e67e22;">火球術！</b> 造成了驚人的 <b style="color:#e74c3c; font-size:1.1em;">${totalFinalDmg}</b> 點傷害！(被抵擋了 ${totalBlocked} 點)`);
    }
    checkBattle();
}

function useLightning() {
    if (!currentMonster || player.skills.lightningCD > 0) return;

    let skillLv = player.skillLevels.lightning;
    let trueDmg = Math.floor(player.atkRange[1] * (2.5 + (skillLv-1) * 2.0)) + Math.floor(Math.pow(1.1,skillLv ) * 100);
    
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
    let healAmount = Math.floor(player.maxHp * (0.4 + skillLv * 0.1)) + Math.floor(player.atkRange[1] * (0.8 + skillLv * 0.2));
    
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
        if (sounds.kill) sounds.kill.play().catch(e => {});
        
        if (currentMonster.isBoss) {
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

        itemDiv.innerHTML = `
            <span style="color: ${color}; font-weight: bold;">${item.name} (${statText})</span>
            <div>
                ${equipActionButton} <button class="btn-dismantle" onclick="dismantleItem(${index})">分解</button>
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


function reduceCooldowns() {
    if (player.skills.fireballCD > 0) player.skills.fireballCD--;
    if (player.skills.lightningCD > 0) player.skills.lightningCD--;
    if (player.skills.healCD > 0) player.skills.healCD--;
    if (player.skills.windWalkCD > 0) player.skills.windWalkCD--;
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
    exploreBtn.innerText = `🧭 開始探險 (💰 ${player.coin})`;
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

    if (player.equiptment.weapon === item) {
        player.equiptment.weapon = null;
        addLog("⚠️ 你分解了手中正在裝備的武器！");
    } else if (player.equiptment.armor === item) {
        player.equiptment.armor = null;
        addLog("⚠️ 你分解了身上穿著的防具！");
    }

    let upgradeValue = 1; 
    if (item.rarity === 'Uncommon') upgradeValue = 3;
    if (item.rarity === 'Rare') upgradeValue = 5;
    if (item.rarity === 'Epic') upgradeValue = 10;
    if (item.rarity === 'Mythic') upgradeValue = 50;

    if (item.type === 'weapon') {
        player.extraATK += upgradeValue; 
        addLog(`🔨 <b style="color:#e67e22;">分解成功！</b> 【${item.name}】化為純粹的力量，永久攻擊力 +${upgradeValue}！`);
    } else {
        player.extraDEF += upgradeValue; 
        addLog(`🔨 <b style="color:#2ecc71;">分解成功！</b> 【${item.name}】化為堅固的鐵壁，永久防禦力 +${upgradeValue}！`);
    }

    player.inventory.splice(index, 1); 
    updateUI();
    saveGame();
}

function deleteSave() {
    if (confirm("確定要刪除所有冒險進度嗎？這無法還原！")) {
        localStorage.removeItem('myRpgSave');
        location.reload(); 
    }
}

// --- 遊戲啟動 ---
loadGame(); 
updateUI();