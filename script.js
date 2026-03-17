let player = {
    hp: 100, maxHp: 100, coin: 0, level: 1, exp: 0, nextLevelExp: 100,
    atkRange: [5, 12],
    skills: { fireballCD: 0, lightningCD: 0, healCD: 0 },
    unlockedSkills: { fireball: true, lightning: false, heal: false }, 
    bossDefeatedLevel: 0,
    protectionAmulet: 0, 
    inventory: [], 
    equiptment: {
        weapon: null, 
        armor: null   
    },
    // 基礎屬性 (不含裝備加成)
    baseAtk: [5, 12],
    extraATK: 0, // 永久攻擊力加成
    baseMaxHp: 100
};

const monsters = [
    { name: "綠色史萊姆", hp: 30, maxHp: 30, image: "images/slime.png", atk: [3, 6], exp: 25, coin: 10 },
    { name: "森林哥布林", hp: 55, maxHp: 55, image: "images/goblin.jpg", atk: [6, 12], exp: 50, coin: 20 },
    { name: "地獄小惡魔", hp: 90, maxHp: 90, image: "images/imp.png", atk: [12, 18], exp: 100, coin: 40 }
];

const items = {
    weapons: [
        { id: 'rusty_sword', name: '生鏽的短劍', atkBonus: 5, rarity: 'Common' },
        { id: 'steel_blade', name: '精鋼長劍', atkBonus: 15, rarity: 'Uncommon' },
        { id: 'dragon_slayer', name: '屠龍大劍', atkBonus: 50, rarity: 'Epic' }
    ],
    armors: [
        { id: 'leather_vest', name: '皮質背心', hpBonus: 30, rarity: 'Common' },
        { id: 'iron_plate', name: '重型鐵甲', hpBonus: 100, rarity: 'Uncommon' }
    ]
};

// --- 魔王設定 ---
const bossTemplate = {
    name: "深淵魔龍", 
    hp: 150, maxHp: 150, 
    image: "images/boss.jpg", 
    atk: [15, 25], 
    exp: 200, coin: 100,
    isBoss: true 
};

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
    
    saveGame(); 
    updateUI(); 
}

function calculateTotalAtk() {
    const weaponBonus = (player.equiptment && player.equiptment.weapon) ? player.equiptment.weapon.atkBonus : 0;
    const totalMin = player.baseAtk[0] + player.extraATK + weaponBonus;
    const totalMax = player.baseAtk[1] + player.extraATK + weaponBonus;
    return [totalMin, totalMax];
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

    // 重新計算當前總戰鬥力
    player.atkRange = calculateTotalAtk();

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
        
        player.nextLevelExp = Math.floor(player.nextLevelExp * 1.5);
        
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
        const randomIndex = Math.floor(Math.random() * monsters.length);
        currentMonster = { ...monsters[randomIndex] }; 
        currentMonster.atk = [...monsters[randomIndex].atk]; 

        let hpMultiplier = 1 + (player.level - 1) * 0.3 + Math.pow(2,player.level/5);
        
        // 攻擊力倍率稍微低一點點，避免小怪一拳把玩家打死
        let atkMultiplier = 1 + (player.level - 1) * 0.25;

        currentMonster.maxHp = Math.floor(currentMonster.maxHp * hpMultiplier);
        currentMonster.hp = currentMonster.maxHp; 
        
        currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
        currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
        
        // 經驗值和金幣跟著血量倍率走，代表「怪物變難打，獎勵也變豐厚」！
        currentMonster.exp = Math.floor(currentMonster.exp * hpMultiplier);
        currentMonster.coin = Math.floor(currentMonster.coin * hpMultiplier);

        currentMonster.name = `Lv.${player.level} ${currentMonster.name}`;

        addLog(`⚠️ 警告！你遭遇了 <b>${currentMonster.name}</b>！`);
        
        document.getElementById('battle-actions').style.display = 'inline-block';
        document.getElementById('explore-btn').style.display = 'none';
    } else {
        let baseFound = Math.floor(Math.random() * 10) + 5;
        let finalFound = Math.floor(baseFound * (1 + (player.level - 1) * 0.2));
        player.coin += finalFound;
        addLog(`💰 你在路邊撿到了 ${finalFound} 枚金幣！`);
        saveGame();
    }
    updateUI();
}

function spawnBoss() {
    addLog("<b style='color: red; font-size: 1.2em;'>🚨 警告！你驚動了強大的領域領主！ 🚨</b>");
    
    currentMonster = { ...bossTemplate };
    currentMonster.atk = [...bossTemplate.atk];
    
    let bossMultiplier = 1 + (player.level - 1) * 0.3 + Math.pow(2.2,player.level/5); 

    currentMonster.maxHp = Math.floor(currentMonster.maxHp * bossMultiplier);
    currentMonster.hp = currentMonster.maxHp;

    // 攻擊力不用指數成長，不然玩家會被秒殺，保持線性或稍微調高就好
    let atkMultiplier = 1 + (player.level - 1) * 0.35;
    currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * atkMultiplier);
    currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * atkMultiplier);
    currentMonster.exp = Math.floor(currentMonster.exp * atkMultiplier);
    currentMonster.coin = Math.floor(currentMonster.coin * bossMultiplier);
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
    let finalDmg = Math.floor(baseDmg * 2.5) + 10;
    
    currentMonster.hp -= finalDmg;
    player.skills.fireballCD = 4;
    
    addLog(`🔥 <b style="color:#e67e22;">火球術！</b> 造成了驚人的 <b style="color:#e74c3c; font-size:1.1em;">${finalDmg}</b> 點傷害！`);
    checkBattle();
}

function useLightning() {
    if (!currentMonster || player.skills.lightningCD > 0) return;

    let dmg = Math.floor(player.atkRange[1] * 3) + 20;
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
    let healAmount = Math.floor(player.maxHp * 0.5) + player.atkRange[1];
    
    // 🌟 2. 拔掉 Math.min 限制！允許血量突破天際！
    player.hp += healAmount; 
    
    player.skills.healCD = 5; 

    addLog(`🌿 <b style="color:#2ecc71;">大治癒術！</b> 溢出的生命力化為護盾，獲得 <b style="color:#2ecc71;">${healAmount}</b> 點生命！`);

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
        if (Math.random() < 0.3) {
            const randomWeapon = items.weapons[Math.floor(Math.random() * items.weapons.length)];
            player.inventory.push(randomWeapon); 
            addLog(`🎁 <b style="color: #f1c40f;">怪物掉落了：【${randomWeapon.name}】！已放入背包。</b>`);
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
        
        let color = "#f5f3f3";
        if(item.rarity === 'Uncommon') color = "#1abc9c";
        if(item.rarity === 'Epic') color = "#9b59b6";
        itemDiv.innerHTML = `
            <span style="color: ${color}">${item.name} (ATK +${item.atkBonus})</span>
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
        player.equiptment.weapon = null;
        addLog("⚠️ 你分解了手中正在裝備的武器！");
    }

    // 2. 根據裝備的稀有度，決定給予多少永久強化值
    let upgradeValue = 1; // 預設 Common 給 1 點
    if (item.rarity === 'Uncommon') upgradeValue = 3;
    if (item.rarity === 'Epic') upgradeValue = 10;

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