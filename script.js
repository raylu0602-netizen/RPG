let player = {
    hp: 100, maxHp: 100, coin: 0, level: 1, exp: 0, nextLevelExp: 100,
    atkRange: [5, 12],
    
    // --- 技能相關 ---
    skills: { fireballCD: 0, lightningCD: 0, healCD: 0 },
    unlockedSkills: { fireball: true, lightning: false, heal: false }, 
    
    // 🌟 加上這行：預設所有技能初始都是 1 級
    skillLevels: { fireball: 1, lightning: 1, heal: 1 }, 
    // ----------------
    
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
            { name: "綠色史萊姆", hp: 20, maxHp: 20, image: "images/slime.png", atk: [3, 6], exp: 25, coin: 20 },
            { name: "森林哥布林", hp: 40, maxHp: 40, image: "images/goblin.jpg", atk: [6, 12], exp: 50, coin: 35 },
            { name: "地獄小惡魔", hp: 80, maxHp: 80, image: "images/imp.png", atk: [12, 18], exp: 75, coin: 50 }
        ],
        boss: {
            name: "深淵魔龍", hp: 160, maxHp: 160, image: "images/boss.jpg", atk: [15, 25], exp: 200, coin: 100, isBoss: true 
        }
    },
    {
        id: 1,
        name: "烈焰火山",
        reqLevel: 10, // 🌟 10 級才能解鎖！
        monsters: [
            { name: "熔岩犬", hp: 120, maxHp: 120, image: "images/hound.png", atk: [20, 35], exp: 180, coin: 100 },
            { name: "火焰精靈", hp: 60, maxHp: 60, image: "images/fire_spirit.png", atk: [30, 45], exp: 130, coin: 80 },
            { name: "火山岩怪", hp: 180, maxHp: 180, image: "images/golem.png", atk: [15, 25], exp: 230, coin: 150 }
        ],
        boss: {
            name: "灰燼鳳凰", hp: 400, maxHp: 400, image: "images/fire_boss.png", atk: [40, 60], exp: 400, coin: 400, isBoss: true 
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

// 預加載與錯誤監控
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
    // 在 buyItem 函數裡修改 'sword' 的邏輯：
    else if (item === 'sword') {
        let currentCost = 100 + (player.extraATK * 10); // 這裡的公式要跟上面一模一樣

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
            player.expAmulet += 1; // 護符數量 +1
            
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
    // --- 🌟 將這段加在 buyItem() 的 if...else 判斷鏈裡面 ---
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
    let roll = Math.random(); // 產生 0.0000 到 0.9999 的隨機數

    // 1. 🌟 0.01% 傳說神劍判定 (機率小於 0.0001)
    if (roll < 0.0001) {
        return {
            name: "✨ 聖劍．艾斯卡諾 ✨",
            type: "weapon",
            rarity: "Mythic",
            atkBonus: 500, // 破格的攻擊力！
            color: "#f39c12" // 閃耀的金黃色
        };
    } 
    // 2. 🟣 3% 史詩裝備
    else if (roll < 0.0301) {
        return generateRandomEquip("Epic", 50, 100);
    } 
    // 3. 🔵 15% 稀有裝備
    else if (roll < 0.1801) {
        return generateRandomEquip("Rare", 20, 49);
    } 
    // 4. 🟢 30% 高級裝備
    else if (roll < 0.4801) {
        return generateRandomEquip("Uncommon", 10, 19);
    } 
    // 5. ⚪ 剩下約 52% 都是普通裝備
    else {
        return generateRandomEquip("Common", 1, 9);
    }
}

// 輔助函數：隨機生成一般裝備的名稱與數值
function generateRandomEquip(rarity, minAtk, maxAtk) {
    const weaponNames = ["長劍", "戰斧", "匕首", "巨劍", "太刀"];
    let randomName = weaponNames[Math.floor(Math.random() * weaponNames.length)];
    let randomAtk = Math.floor(Math.random() * (maxAtk - minAtk + 1)) + minAtk;
    
    // 根據玩家等級稍微提升掉落裝備的素質
    randomAtk += Math.floor(randomAtk*player.level * 0.5); 

    return {
        name: `【${rarity}】${randomName}`,
        type: "weapon",
        rarity: rarity,
        atkBonus: randomAtk
    };
}
function updateUI() {
    // 安全保險機制 (防範舊存檔缺失資料)
    if (!player.inventory) player.inventory = [];
    if (!player.equiptment) player.equiptment = { weapon: null, armor: null };
    if (player.protectionAmulet === undefined) player.protectionAmulet = 0;
    if (!player.baseAtk) player.baseAtk = [5, 12];
    if (!player.atkRange) player.atkRange = [5, 12];
    if (player.extraATK === undefined) player.extraATK = 0; 
    if (!player.maxHp) player.maxHp = 100;
    if (!player.unlockedSkills) player.unlockedSkills = { fireball: true, lightning: false, heal: false };
    // 放在 updateUI() 函數的最前面幾行
    if (!player.skillLevels) {
        player.skillLevels = { fireball: 1, lightning: 1, heal: 1 };
    }
    if (player.currentArea === undefined) player.currentArea = 0;
    // 重新計算當前總戰鬥力
    player.atkRange = calculateTotalAtk();
    // --- 🌟 經驗護符的保險機制與 UI 更新 ---
    if (player.expAmulet === undefined) {
        player.expAmulet = 0; // 如果舊存檔沒有這個道具，預設為 0 個
    }
    
    const amuletText = document.getElementById('amulet-text');
    if (amuletText) {
        let cost = 200 + (player.expAmulet * 150); // 基礎 200g，每買一個貴 150g
        let bonus = player.expAmulet * 10; // 每個護符增加 10% 經驗
        amuletText.innerText = `✨ 經驗護符 (+${bonus}% 經驗) (${cost}g)`;
    }
    // --- 🌟 金幣護符的保險機制與 UI 更新 ---
    if (player.goldAmulet === undefined) {
        player.goldAmulet = 0; // 舊存檔預設為 0 個
    }
    
    const goldAmuletText = document.getElementById('gold-amulet-text');
    if (goldAmuletText) {
        let cost = 200 + (player.goldAmulet * 150); // 價格成長跟經驗護符一樣
        let bonus = player.goldAmulet * 5; // 每個護符增加 5% 金幣
        goldAmuletText.innerText = `🪙 金幣護符 (+${bonus}% 金幣) (${cost}g)`;
    }
    // 更新介面數值
    // 在 updateUI() 裡找到這段並替換：
    document.getElementById('player-hp').innerText = `${player.hp} / ${player.maxHp}`;
    
    const hpFill = document.getElementById('player-hp-fill');
    if (player.hp > player.maxHp) {
        // 過量護盾狀態
        hpFill.style.width = "100%";
        hpFill.style.backgroundColor = "#f1c40f"; // 金色
        document.getElementById('player-hp').innerText = `🛡️ ${player.hp} / ${player.maxHp}`;
    } else {
        // 正常狀態
        hpFill.style.width = (player.hp / player.maxHp * 100) + "%";
        hpFill.style.backgroundColor = "#2ecc71"; // 恢復原本的綠色 (或紅色，看你原本 CSS 怎麼寫)
    }
    document.getElementById('player-hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    document.getElementById('player-level').innerText = player.level;
    document.getElementById('player-exp').innerText = `${player.exp} / ${player.nextLevelExp}`;
    document.getElementById('player-exp-fill').style.width = (player.exp / player.nextLevelExp * 100) + "%";
    document.getElementById('player-coin-display').innerText = player.coin;
    
    const amuletDisplay = document.getElementById('player-amulet-display');
    if(amuletDisplay) amuletDisplay.innerText = player.protectionAmulet;

    // 更新攻擊力文字
    const atkText = `${player.atkRange[0]} - ${player.atkRange[1]}`;
    const atkDisplay = document.getElementById('player-atk-display');
    if(atkDisplay) atkDisplay.innerText = atkText;
    
    const atkElement = document.getElementById('player-atk');
    if (atkElement) {
        // ✅ 修正錯誤一：改用大寫的 extraATK
        const bonus = player.extraATK + ((player.equiptment.weapon) ? player.equiptment.weapon.atkBonus : 0);
        atkElement.innerText = `${player.baseAtk[0]} ~ ${player.baseAtk[1]} (總加成: +${bonus})`;
    }
    // 放在 updateUI() 函數裡面
    const swordPriceElement = document.getElementById('sword-price');
    if (swordPriceElement) {
        // 每次買長劍 extraATK 會 +5，所以這裡乘 10 的話，買一次會貴 50 金幣
        let currentCost = 100 + (player.extraATK * 10); 
        swordPriceElement.innerText = currentCost;
    }
    // 更新技能按鈕
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
    // 火球術升級 (預設就有，所以直接顯示)
        const upgFb = document.getElementById('shop-upg-fireball');
        if (upgFb) {
            upgFb.style.display = 'flex'; // 顯示
            let costFb = 200 + (player.skillLevels.fireball * 150); // 動態價格
            document.getElementById('fireball-upg-text').innerText = `🔥 升級火球術 Lv.${player.skillLevels.fireball} (${costFb}g)`;
        }

        // 閃電斬升級 (有解鎖才顯示)
        const upgLt = document.getElementById('shop-upg-lightning');
        if (upgLt) {
            upgLt.style.display = player.unlockedSkills.lightning ? 'flex' : 'none';
            let costLt = 300 + (player.skillLevels.lightning * 200);
            document.getElementById('lightning-upg-text').innerText = `⚡ 升級閃電斬 Lv.${player.skillLevels.lightning} (${costLt}g)`;
        }

        // 治癒術升級 (有解鎖才顯示)
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

    // 控制商店按鈕
    const shopLt = document.getElementById('shop-lightning');
    if (shopLt) shopLt.style.display = player.unlockedSkills.lightning ? 'none' : 'flex';
    const shopHl = document.getElementById('shop-heal');
    if (shopHl) shopHl.style.display = player.unlockedSkills.heal ? 'none' : 'flex';

    // 怪物顯示
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
        
        // --- 🌟 護盾保護機制 ---
        if (player.hp < player.maxHp) {
            // 如果受傷了，升級幫你補滿血
            player.hp = player.maxHp; 
        } else {
            // 如果你有護盾，不僅不扣除，還把升級增加的 20 點血量疊加上去！
            player.hp += 20; 
        }
        // -------------------------

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
    
    if (player.level % 5 === 0 && player.bossDefeatedLevel !== player.level) {
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
        
        // 攻擊力倍率稍微低一點點，避免小怪一拳把玩家打死
        let atkMultiplier = 1 + (player.level - 1) * 0.25;

        currentMonster.maxHp = Math.floor(currentMonster.maxHp * hpMultiplier);
        currentMonster.hp = currentMonster.maxHp; 
        
        currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
        currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
        
        // 經驗值和金幣跟著血量倍率走，代表「怪物變難打，獎勵也變豐厚」！
        let expBonusRate = 1 + (player.expAmulet * 0.1); // 計算護符倍率 (例如買了2個就是 1.2 倍)
        currentMonster.exp = Math.floor(currentMonster.exp * hpMultiplier * expBonusRate);
        let goldBonusRate = 1 + (player.goldAmulet * 0.05); // 計算金幣倍率 (1個=1.05倍，2個=1.1倍)
        currentMonster.coin = Math.floor(currentMonster.coin * hpMultiplier * goldBonusRate);

        currentMonster.name = `Lv.${player.level} ${currentMonster.name}`;

        addLog(`⚠️ 警告！你遭遇了 <b>${currentMonster.name}</b>！`);
        
        document.getElementById('battle-actions').style.display = 'inline-block';
        document.getElementById('explore-btn').style.display = 'none';
    } else {
        let baseFound = Math.floor(Math.random() * 10) + 5;
        let finalFound = Math.floor(baseFound * (1 + (player.level - 1) * 0.2));
        
        // 🌟 加上金幣護符的加成
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
    
    let bossMultiplier = 1 + (player.level - 1) * 0.3 + Math.pow(2.2,player.level/5); 

    currentMonster.maxHp = Math.floor(currentMonster.maxHp * bossMultiplier);
    currentMonster.hp = currentMonster.maxHp;

    // 攻擊力不用指數成長，不然玩家會被秒殺，保持線性或稍微調高就好
    let atkMultiplier = 1 + (player.level - 1) * 0.5;
    currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
    currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
    let expBonusRate = 1 + ((player.expAmulet || 0) * 0.1);
    currentMonster.exp = Math.floor(currentMonster.exp * bossMultiplier * expBonusRate);
    let goldBonusRateBoss = 1 + ((player.goldAmulet || 0) * 0.05);
    currentMonster.coin = Math.floor(currentMonster.coin * bossMultiplier * goldBonusRateBoss);
    currentMonster.name = `💀 領域領主：${currentMonster.name} (Lv.${player.level})`;

    const hpFill = document.getElementById('monster-hp-fill');
    if(hpFill) hpFill.style.backgroundColor = "darkred";

    document.getElementById('battle-actions').style.display = 'inline-block';
    document.getElementById('explore-btn').style.display = 'none';
    updateUI();
}

function attack() {
    if (!currentMonster || player.hp <= 0) return;
    
    sounds.attack.currentTime = 0;
    sounds.attack.play().catch(e => console.log("等待點擊觸發音效"));

    let dmg = Math.floor(Math.random() * (player.atkRange[1] - player.atkRange[0] + 1)) + player.atkRange[0];
    currentMonster.hp -= dmg;
    addLog(`⚔️ 你攻擊了，造成 ${dmg} 點傷害。`);
    checkBattle();
}

function useFireball() {
    if (!currentMonster || player.skills.fireballCD > 0) return;
    
    if (sounds.fireball) {
        sounds.fireball.currentTime = 0;
        sounds.fireball.play().catch(e => {});
    }

    let baseDmg = Math.floor(Math.random() * (player.atkRange[1] - player.atkRange[0] + 1)) + player.atkRange[0];
    let skillLv = player.skillLevels.fireball;
    let finalDmg = Math.floor(baseDmg * (1.0 + skillLv * 1)) + (skillLv * 10);
    
    currentMonster.hp -= finalDmg;
    player.skills.fireballCD = 4;
    
    addLog(`🔥 <b style="color:#e67e22;">火球術！</b> 造成了驚人的 <b style="color:#e74c3c; font-size:1.1em;">${finalDmg}</b> 點傷害！`);
    checkBattle();
}

function useLightning() {
    if (!currentMonster || player.skills.lightningCD > 0) return;

    let skillLv = player.skillLevels.lightning;
    let dmg = Math.floor(player.atkRange[1] * (1.5 + skillLv * 1.0)) + (skillLv * 20);
    currentMonster.hp -= dmg;
    player.skills.lightningCD = 5; 

    addLog(`⚡ <b style="color:#9b59b6;">閃電斬！</b> 對敵人造成了 <b style="color:#e74c3c;">${dmg}</b> 點巨額傷害！`);
    checkBattle(); 
}

// --- 🌿 進階治癒術：神聖新星 ---
// --- 🌿 終極治癒術：過量護盾 ---
function useHeal() {
    if (!currentMonster || player.skills.healCD > 0) return;

    // 1. 治癒量狂飆：吃你那超高的攻擊力加成！
    // 原本：let healAmount = Math.floor(player.maxHp * 0.5) + player.atkRange[1];
    // 🌟 升級版：每升一級，吃最大血量比例多 10%，吃攻擊力的比例多 20%！
    let skillLv = player.skillLevels.heal;
    let healAmount = Math.floor(player.maxHp * (0.4 + skillLv * 0.1)) + Math.floor(player.atkRange[1] * (0.8 + skillLv * 0.2));
    
    // 🌟 2. 拔掉 Math.min 限制！允許血量突破天際！
    player.hp += healAmount; 
    
    player.skills.healCD = 5; 

    addLog(`🌿 <b style="color:#2ecc71;">大治癒術！</b> 溢出的生命力化為護盾，獲得 <b style="color:#2ecc71;">${healAmount}</b> 點生命！`);
    reduceCooldowns() 
    // 3. 怪物反擊
    monsterTurn(); 
    updateUI();

    // 🌟 4. 視覺特效：如果血量超過上限，把血條變成「金色護盾」
    const hpFill = document.getElementById('player-hp-fill');
    if (player.hp > player.maxHp && hpFill) {
        hpFill.style.backgroundColor = "#f1c40f"; // 金色
        hpFill.style.width = "100%"; // 保持滿格
        
        // 讓文字顯示成 3000 / 300 這種超狂數字
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
        
        // 掉落裝備系統
    if (Math.random() < 0.4) {
        let newEquip = rollLoot(); // 🎲 呼叫我們剛剛寫的抽獎系統
        
        player.inventory.push(newEquip);
        
        // 如果抽中傳說神劍，給他一個超級誇張的廣播公告！
        if (newEquip.rarity === "Mythic") {
            addLog(`🎊 <b style="color: #f1c40f; font-size: 1.5em; text-shadow: 0 0 5px #f1c40f;">奇蹟降臨！你獲得了傳說中的【${newEquip.name}】！</b> 🎊`);
        } else {
            let color = newEquip.rarity === "Epic" ? "#9b59b6" : 
                        newEquip.rarity === "Rare" ? "#3498db" : 
                        newEquip.rarity === "Uncommon" ? "#2ecc71" : "#bdc3c7";
            addLog(`🎁 怪物掉落了裝備：<b style="color: ${color};">${newEquip.name} (攻擊力 +${newEquip.atkBonus})</b>`);
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
    const listElement = document.getElementById('inventory-list');
    if (!listElement) return;

    listElement.innerHTML = ''; 

    if (player.inventory.length === 0) {
        listElement.innerHTML = '<p style="color: #666;">背包空空如也...</p>';
        return;
    }

    player.inventory.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'inventory-item';
        
        // 🌟 這裡補齊了所有裝備稀有度的顏色判斷！
        let color = "#bdc3c7"; // 預設為 Common (普通) 的灰色
        if(item.rarity === 'Uncommon') color = "#2ecc71"; // 高級 (綠色)
        if(item.rarity === 'Rare') color = "#3498db";     // 稀有 (藍色)
        if(item.rarity === 'Epic') color = "#9b59b6";     // 史詩 (紫色)
        if(item.rarity === 'Mythic') color = "#f39c12";   // 傳說 (橘金色)

        itemDiv.innerHTML = `
            <span style="color: ${color}; font-weight: bold;">${item.name} (ATK +${item.atkBonus})</span>
            <div>
                <button class="btn-equip" onclick="equipItem(${index})">裝備</button>
                <button class="btn-dismantle" onclick="dismantleItem(${index})">分解</button>
            </div>
        `;
        listElement.appendChild(itemDiv);
    });
}

function equipItem(index) {
    const item = player.inventory[index];
    if (!item) return;

    if (item.atkBonus !== undefined) {
        player.equiptment.weapon = item;
        addLog(`⚔️ 裝備了 【${item.name}】，攻擊力提升了 ${item.atkBonus}！`);
    }

    // ✅ 修正錯誤三：刪除這裡手動計算 atkRange 的邏輯，讓 updateUI() 全權處理
    updateUI(); 
    saveGame();
}

function reduceCooldowns() {
    if (player.skills.fireballCD > 0) player.skills.fireballCD--;
    if (player.skills.lightningCD > 0) player.skills.lightningCD--;
    if (player.skills.healCD > 0) player.skills.healCD--;
}
// 渲染地圖選單 (只有達到等級要求才會顯示該區域)
function renderAreaSelector() {
    const container = document.getElementById('area-selector-container');
    const select = document.getElementById('area-select');
    if (!container || !select) return;

    // 如果玩家達到 10 級，才顯示切換地圖的介面
    if (player.level >= 10) {
        container.style.display = 'block';
        select.innerHTML = ''; // 先清空

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

// 玩家切換選單時觸發
function changeArea() {
    const select = document.getElementById('area-select');
    player.currentArea = parseInt(select.value);
    addLog(`🗺️ 你收拾行囊，前往了新的區域：<b style="color:#3498db;">${areas[player.currentArea].name}</b>！`);
    saveGame();
    updateUI();
}
function monsterTurn() {
    let dmg = Math.floor(Math.random() * (currentMonster.atk[1] - currentMonster.atk[0])) + currentMonster.atk[0];
    player.hp -= dmg;
    addLog(`👾 ${currentMonster.name} 反擊，你受到 ${dmg} 點傷害。`);
    
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
                // ✅ 修正二的延伸：死亡懲罰也必須扣 baseAtk
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

    const exploreBtn = document.getElementById('explore-btn');
    exploreBtn.innerText = `🧭 開始探險 (💰 ${player.coin})`;
    exploreBtn.style.backgroundColor = ""; // 恢復原本顏色 (如果你 CSS 有預設)
    exploreBtn.onclick = explore; 

    const shopContainer = document.getElementById('shop-container');
    if(shopContainer) shopContainer.style.display = 'block';
    
    updateUI(); // 🌟 重大提醒：務必先更新 UI 重算攻擊力
    saveGame(); // 🌟 然後再存檔
}
// --- 🔨 裝備分解系統 ---
function dismantleItem(index) {
    const item = player.inventory[index];
    if (!item) return;

    // 1. 為了安全，如果玩家分解的是「正在穿」的武器，就自動幫他脫下來
    if (player.equiptment.weapon === item) {
        // 🌟 拔掉武器前，先扣除它原本給的攻擊力！
        // (請確認你裝備時是加到哪個變數，如果是 extraATK 就扣 extraATK)
        player.extraATK -= item.atkBonus; 
        
        player.equiptment.weapon = null;
        addLog("⚠️ 你分解了手中正在裝備的武器！");
    }

    // 2. 根據裝備的稀有度，決定給予多少永久強化值
    let upgradeValue = 1; // 預設 Common 給 1 點
    if (item.rarity === 'Uncommon') upgradeValue = 3;
    if (item.rarity === 'Rare') upgradeValue = 5;
    if (item.rarity === 'Epic') upgradeValue = 10;
    if (item.rarity === 'Mythic') upgradeValue = 50;

    // 3. 增加永久攻擊力
    player.extraATK += upgradeValue; 

    // 4. 從背包陣列中把這個物品「剔除」(splice 代表刪除陣列中特定位置的元素)
    player.inventory.splice(index, 1); 

    addLog(`🔨 <b style="color:#e67e22;">分解成功！</b> 【${item.name}】化為純粹的力量，永久攻擊力 +${upgradeValue}！`);

    // 5. 更新畫面與存檔
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