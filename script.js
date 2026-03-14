// --- 1. 資料設定 ---
let player = {
    hp: 100, maxHp: 100, coin: 0, level: 1, exp: 0, nextLevelExp: 100,
    atkRange: [5, 12],
    skills: { fireballCD: 0, lightningCD: 0, healCD: 0 },
    unlockedSkills: { fireball: true, lightning: false, heal: false }, 
    bossDefeatedLevel: 0,
    protectionAmulet: 0 // <--- 🌟 加上這行：初始擁有 0 個守護十字架
};

const monsters = [
    { name: "綠色史萊姆", hp: 30, maxHp: 30, image: "images/slime.png", atk: [3, 6], exp: 25, coin: 10 },
    { name: "森林哥布林", hp: 55, maxHp: 55, image: "images/goblin.jpg", atk: [6, 12], exp: 50, coin: 20 },
    { name: "地獄小惡魔", hp: 90, maxHp: 90, image: "images/imp.png", atk: [12, 18], exp: 100, coin: 40 }
];
// --- 魔王設定 ---
const bossTemplate = {
    name: "深淵魔龍", 
    hp: 150, maxHp: 150, 
    image: "images/boss.jpg", // 你可以改成 "images/boss.png"
    atk: [15, 25], 
    exp: 200, coin: 100,
    isBoss: true // 用來標記牠是魔王
};
let currentMonster = null;

// --- 2. 穩定音效設定 ---
// 使用更穩定的網址，若還是失敗建議下載後改為 "sounds/attack.mp3"
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

// --- 3. 核心功能 ---
function buyItem(item) {
    if (item === 'potion') {
        if (player.coin >= 20) {
            player.coin -= 20;
            player.hp = Math.min(player.hp + 30, player.maxHp);
            addLog("🥤 喝下了紅色藥水，回復了 30 點 HP！");
        } else {
            addLog("❌ 金幣不足！");
        }
    } else if (item === 'sword') {
        if (player.coin >= 100) {
            player.coin -= 100;
            player.atkRange[0] += 5;
            player.atkRange[1] += 5;
            addLog("⚔️ 購買了鋒利長劍！你的攻擊力永久提升了！");
            const display = document.getElementById('player-atk-display');
            display.style.color = "#2ecc71"; // 變成綠色
            setTimeout(() => { display.style.color = "#e74c3c"; }, 1000);
        } else {
            addLog("❌ 金幣不足！");
        }
    }
    saveGame(); // 買完記得存檔
    updateUI();
}
function buyItem(item) {
    if (item === 'potion') {
        if (player.coin >= 20) {
            player.coin -= 20;
            player.hp = Math.min(player.hp + 30, player.maxHp);
            addLog("🥤 喝下了紅色藥水，回復了 30 點 HP！");
        } else {
            addLog("❌ 金幣不足！");
        }
    } else if (item === 'sword') {
        if (player.coin >= 100) {
            player.coin -= 100;
            player.atkRange[0] += 5;
            player.atkRange[1] += 5;
            addLog("⚔️ 購買了鋒利長劍！你的攻擊力永久提升了！");
            const display = document.getElementById('player-atk-display');
            display.style.color = "#2ecc71"; // 變成綠色
            setTimeout(() => { display.style.color = "#e74c3c"; }, 1000);
        } else {
            addLog("❌ 金幣不足！");
        }
    } 
    // 🌟 新增：購買閃電斬技能書
    else if (item === 'lightning_book') {
        if (player.coin >= 150) {
            player.coin -= 150;
            player.unlockedSkills.lightning = true; // 解鎖技能
            addLog("📘 <b style='color:#9b59b6;'>你翻開了古老的技能書，學會了新技能：【⚡ 閃電斬】！</b>");
        } else {
            addLog("❌ 金幣不足！");
        }
    } 
    // 🌟 新增：購買治癒術技能書
    else if (item === 'heal_book') {
        if (player.coin >= 200) {
            player.coin -= 200;
            player.unlockedSkills.heal = true; // 解鎖技能
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
    
    saveGame(); // 買完存檔
    updateUI(); // 刷新介面
}
function updateUI() {
    if (player.protectionAmulet === undefined) player.protectionAmulet = 0;
    const amuletDisplay = document.getElementById('player-amulet-display');
    if(amuletDisplay) amuletDisplay.innerText = player.protectionAmulet;
    // 玩家狀態與等級
    document.getElementById('player-hp').innerText = `${player.hp} / ${player.maxHp}`;
    document.getElementById('player-hp-fill').style.width = (player.hp / player.maxHp * 100) + "%";
    
    document.getElementById('player-level').innerText = player.level;
    document.getElementById('player-exp').innerText = `${player.exp} / ${player.nextLevelExp}`;
    document.getElementById('player-exp-fill').style.width = (player.exp / player.nextLevelExp * 100) + "%";
    // 🌟 為了防止舊存檔沒有 unlockedSkills 導致報錯，加入這行保護機制
    if (!player.unlockedSkills) player.unlockedSkills = { fireball: true, lightning: false, heal: false };

    // 更新閃電斬按鈕
    const ltBtn = document.getElementById('lightning-btn');
    if (ltBtn) {
        const isLtUnlocked = player.unlockedSkills && player.unlockedSkills.lightning;
        ltBtn.style.display = isLtUnlocked ? 'inline-block' : 'none';
        
        if (isLtUnlocked) {
            if (player.skills.lightningCD > 0) {
                ltBtn.disabled = true;
                ltBtn.innerText = `⚡ CD ${player.skills.lightningCD}`;
            } else {
                ltBtn.disabled = false;
                ltBtn.innerText = "⚡ 閃電斬";
            }
        }
    }

    // 2. 處理【治癒術】按鈕的顯示與冷卻
    const hlBtn = document.getElementById('heal-btn');
    if (hlBtn) {
        const isHlUnlocked = player.unlockedSkills && player.unlockedSkills.heal;
        hlBtn.style.display = isHlUnlocked ? 'inline-block' : 'none';
        
        if (isHlUnlocked) {
            if (player.skills.healCD > 0) {
                hlBtn.disabled = true;
                hlBtn.innerText = `🌿 CD ${player.skills.healCD}`;
            } else {
                hlBtn.disabled = false;
                hlBtn.innerText = "🌿 治癒術";
            }
        }
    }
    
    // ... 控制商店技能書消失的邏輯 ...
    const shopLt = document.getElementById('shop-lightning');
    if (shopLt) shopLt.style.display = (player.unlockedSkills && player.unlockedSkills.lightning) ? 'none' : 'flex';
    
    const shopHl = document.getElementById('shop-heal');
    if (shopHl) shopHl.style.display = (player.unlockedSkills && player.unlockedSkills.heal) ? 'none' : 'flex';

    // 怪物顯示
    const imgElement = document.getElementById('monster-img');
    const placeholder = document.getElementById('placeholder-text');
    const atkText = `${player.atkRange[0]} - ${player.atkRange[1]}`;
    document.getElementById('player-atk-display').innerText = atkText;
    
    // 更新金幣顯示
    document.getElementById('player-coin-display').innerText = player.coin;
    
    if (currentMonster) {
        document.getElementById('monster-hp').innerText = `${currentMonster.hp} / ${currentMonster.maxHp}`;
        document.getElementById('monster-hp-fill').style.width = (currentMonster.hp / currentMonster.maxHp * 100) + "%";
        imgElement.src = currentMonster.image;
        imgElement.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        document.getElementById('monster-hp').innerText = "休息中";
        document.getElementById('monster-hp-fill').style.width = "0%";
        imgElement.style.display = 'none';
        placeholder.style.display = 'block';
    }

    const fbBtn = document.getElementById('fireball-btn');
    fbBtn.disabled = player.skills.fireballCD > 0;
    fbBtn.innerText = player.skills.fireballCD > 0 ? `🔥 CD ${player.skills.fireballCD}` : "🔥 火球術";
    // 在 updateUI 函數內加入
    document.getElementById('explore-btn').innerText = `🧭 開始探險 (💰 ${player.coin})`;
}

function addLog(msg) {
    const logBox = document.getElementById('log');
    const p = document.createElement('p');
    p.innerHTML = msg;
    logBox.prepend(p);
}
// --- 存檔與讀檔功能 ---

// 存檔：把玩家資料轉成字串存進瀏覽器
function saveGame() {
    const gameData = JSON.stringify(player); // 把物件變成字串
    localStorage.setItem('myRpgSave', gameData);
    addLog("<b style='color: #43b581;'>💾 遊戲已自動存檔！</b>");
}

// 讀檔：從瀏覽器拿回字串並變回物件
function loadGame() {
    const savedData = localStorage.getItem('myRpgSave');
    if (savedData) {
        player = JSON.parse(savedData); // 把字串變回物件
        // 重置所有技能 CD (防止存檔時在 CD 中，讀檔後卡住)
        player.skills.fireballCD = 0;
        addLog("<b style='color: #7289da;'>📖 已載入上次的冒險進度！</b>");
        updateUI();
    }
}
// --- 4. 戰鬥邏輯 ---

function checkLevelUp() {
    if (player.exp >= player.nextLevelExp) {
        player.exp -= player.nextLevelExp;
        player.level++;
        player.maxHp += 20;
        player.hp = player.maxHp; // 升級回滿血
        player.atkRange[0] += 2;
        player.atkRange[1] += 4;
        player.nextLevelExp = Math.floor(player.nextLevelExp * 1.5);
        
        addLog(`<b style="color: #f1c40f;">✨ 恭喜升級！目前等級：LV.${player.level}</b>`);
        checkLevelUp(); // 再次檢查是否可連升
    }
}
// --- 探險功能 ---
// --- 探險功能 (動態難度版) ---
// --- 探險功能 (包含 Boss 系統) ---
function explore() {
    const shopContainer = document.getElementById('shop-container');
    if(shopContainer) shopContainer.style.display = 'none';
    
    // 🌟 檢查是否該打 Boss 了 (每 5 級觸發，且該等級還沒打贏過)
    if (player.level % 5 === 0 && player.bossDefeatedLevel !== player.level) {
        spawnBoss();
        return; // 直接中斷一般探險，進入 Boss 戰
    }

    addLog("🌲 你進入了危險區域探險...");
    
    // ... 下面是你原本的 80% 機率遇到一般怪物的邏輯 ...
    if (Math.random() < 0.8) {
        const randomIndex = Math.floor(Math.random() * monsters.length);
        currentMonster = { ...monsters[randomIndex] }; 
        currentMonster.atk = [...monsters[randomIndex].atk]; 

        document.getElementById('battle-actions').style.display = 'block';
        document.getElementById('explore-btn').style.display = 'none';
        
        updateUI();
        
        let multiplier = 1 + (player.level - 1) * 0.2;
        currentMonster.maxHp = Math.floor(currentMonster.maxHp * multiplier);
        currentMonster.hp = currentMonster.maxHp; 
        currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * multiplier);
        currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * multiplier);
        currentMonster.exp = Math.floor(currentMonster.exp * multiplier);
        currentMonster.coin = Math.floor(currentMonster.coin * multiplier);
        currentMonster.name = `Lv.${player.level} ${currentMonster.name}`;

        addLog(`⚠️ 警告！你遭遇了 <b>${currentMonster.name}</b>！`);
        document.getElementById('battle-actions').style.display = 'inline-block'; // 確保這層父容器開了
        document.getElementById('battle-actions').style.display = 'inline';
        document.getElementById('explore-btn').style.display = 'none';
        // 遇到怪物時
        
    } else {
        let baseFound = Math.floor(Math.random() * 10) + 5;
        let finalFound = Math.floor(baseFound * (1 + (player.level - 1) * 0.2));
        player.coin += finalFound;
        addLog(`💰 你在路邊撿到了 ${finalFound} 枚金幣！`);
        saveGame();
    }
    updateUI();
}

// 🌟 新增召喚 Boss 的函數
function spawnBoss() {
    addLog("<b style='color: red; font-size: 1.2em;'>🚨 警告！你驚動了強大的領域領主！ 🚨</b>");
    
    currentMonster = { ...bossTemplate };
    currentMonster.atk = [...bossTemplate.atk];
    
    // Boss 的成長倍率比一般怪物更高 (0.3 倍)
    let bossMultiplier = 1 + (player.level - 1) * 0.3; 
    
    currentMonster.maxHp = Math.floor(currentMonster.maxHp * bossMultiplier);
    currentMonster.hp = currentMonster.maxHp;
    currentMonster.atk[0] = Math.floor(currentMonster.atk[0] * bossMultiplier);
    currentMonster.atk[1] = Math.floor(currentMonster.atk[1] * bossMultiplier);
    currentMonster.exp = Math.floor(currentMonster.exp * bossMultiplier);
    currentMonster.coin = Math.floor(currentMonster.coin * bossMultiplier);
    
    currentMonster.name = `💀 領域領主：${currentMonster.name} (Lv.${player.level})`;

    // 可以讓 Boss 的血條變大或變顏色 (可選)
    document.getElementById('monster-hp-fill').style.backgroundColor = "darkred";

    document.getElementById('battle-actions').style.display = 'inline';
    document.getElementById('explore-btn').style.display = 'none';
    updateUI();
}
function attack() {
    if (!currentMonster || player.hp <= 0) return;
    
    // 嘗試播放音效
    sounds.attack.currentTime = 0;
    sounds.attack.play().catch(e => console.log("等待點擊觸發音效"));

    let dmg = Math.floor(Math.random() * (player.atkRange[1] - player.atkRange[0] + 1)) + player.atkRange[0];
    currentMonster.hp -= dmg;
    addLog(`⚔️ 你攻擊了，造成 ${dmg} 點傷害。`);
    checkBattle();
}

function useFireball() {
    if (!currentMonster || player.skills.fireballCD > 0) return;
    
    // 播放音效
    if (sounds.fireball) {
        sounds.fireball.currentTime = 0;
        sounds.fireball.play().catch(e => {});
    }

    // 1. 先計算出這回合原本的「基礎攻擊力」
    let baseDmg = Math.floor(Math.random() * (player.atkRange[1] - player.atkRange[0] + 1)) + player.atkRange[0];
    
    // 2. 加入技能倍率 (例如 2.5 倍) 加上一點額外魔法傷害 (例如 10 點)
    let finalDmg = Math.floor(baseDmg * 2.5) +10;
    
    // 3. 扣除怪物血量
    currentMonster.hp -= finalDmg;
    
    // 4. 進入冷卻
    player.skills.fireballCD = 4;
    
    // 5. 顯示華麗的日誌
    addLog(`🔥 <b style="color:#e67e22;">火球術！</b> 造成了驚人的 <b style="color:#e74c3c; font-size:1.1em;">${finalDmg}</b> 點傷害！`);
    
    checkBattle();
}
// --- ⚡ 閃電斬功能 ---
function useLightning() {
    if (!currentMonster || player.skills.lightningCD > 0) return;

    // 傷害邏輯：造成攻擊力上限的 2.5 倍傷害
    let dmg = Math.floor(player.atkRange[1] * 3)+20;
    currentMonster.hp -= dmg;
    player.skills.lightningCD = 5; // 設定冷卻時間

    addLog(`⚡ <b style="color:#9b59b6;">閃電斬！</b> 對敵人造成了 <b style="color:#e74c3c;">${dmg}</b> 點巨額傷害！`);

    checkBattle(); // 檢查怪物是否死亡
}

// --- 🌿 治癒術功能 ---
function useHeal() {
    if (!currentMonster || player.skills.healCD > 0) return;

    // 回血邏輯：恢復最大血量的 40%
    let healAmount = Math.floor(player.maxHp * 0.4);
    player.hp = Math.min(player.hp + healAmount, player.maxHp);
    player.skills.healCD = 6; // 設定冷卻時間

    addLog(`🌿 <b style="color:#2ecc71;">治癒術！</b> 恢復了 <b style="color:#2ecc71;">${healAmount}</b> 點生命值！`);

    // 🌟 補血不造成傷害，所以直接讓怪物反擊
    monsterTurn(); 
    updateUI();
}
function checkBattle() {
    if (currentMonster.hp <= 0) {
        currentMonster.hp = 0;
        if (sounds.kill) sounds.kill.play().catch(e => {});
        
        // 🌟 如果死掉的是 Boss
        if (currentMonster.isBoss) {
            player.bossDefeatedLevel = player.level; // 記錄下來，這級不會再遇到了
            addLog(`<b style='color: #f39c12;'>🎉 難以置信！你擊敗了魔王，獲得了豐厚的獎勵！</b>`);
            // Boss 戰後把血條顏色改回原本的紅色
            document.getElementById('monster-hp-fill').style.backgroundColor = "#e74c3c";
        } else {
            addLog(`🏆 擊敗 ${currentMonster.name}！獲得 ${currentMonster.exp} 經驗與 ${currentMonster.coin} 金幣。`);
        }
        
        player.exp += currentMonster.exp;
        player.coin += currentMonster.coin;
        
        checkLevelUp();
        saveGame(); // 存檔
        
        currentMonster = null;
        document.getElementById('battle-actions').style.display = 'none';
        document.getElementById('explore-btn').style.display = 'inline';
        document.getElementById('explore-btn').innerText = `🧭 開始探險 (💰 ${player.coin})`;
        
        const shopContainer = document.getElementById('shop-container');
        if(shopContainer) shopContainer.style.display = 'block';
        
    } else {
        reduceCooldowns();
        monsterTurn();
    }
    updateUI();
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
        
        // 隱藏戰鬥按鈕
        document.getElementById('battle-actions').style.display = 'none';
        
        // 🌟 把探險按鈕改成「復活按鈕」
        const exploreBtn = document.getElementById('explore-btn');
        exploreBtn.style.display = 'inline-block';
        exploreBtn.innerText = "☠️ 接受命運並復活";
        exploreBtn.style.backgroundColor = "#e74c3c"; // 變成紅色警告
        exploreBtn.onclick = revive; // 點擊時觸發復活函數
    }
}
// --- ☠️ 復活與死亡懲罰系統 ---
// --- ☠️ 復活與死亡懲罰系統 (動態懲罰版) ---
function revive() {
    // 1. 檢查是否有免死金牌
    if (player.protectionAmulet > 0) {
        player.protectionAmulet--;
        addLog("✨ <b style='color:#f1c40f;'>【守護十字架】發出耀眼光芒碎裂了！你免除了死亡懲罰並滿血復活！</b>");
    } 
    // 2. 沒有道具，執行嚴厲的死亡懲罰
    else {
        if (player.level > 1) {
            // 🌟 懲罰隨等級增加：基礎掉 1 級，每 5 級多掉 1 級
            let levelsToLose = 1 + Math.floor(player.level / 5);
            
            // 確保不會掉到 1 級以下
            if (player.level - levelsToLose < 1) {
                levelsToLose = player.level - 1;
            }

            // 用迴圈安全地扣除屬性
            for (let i = 0; i < levelsToLose; i++) {
                player.level--;
                player.maxHp -= 20; 
                player.atkRange[0] -= 2;
                player.atkRange[1] -= 4;
            }
            
            // 🌟 精準重算升級所需經驗值 (防止來回升降級造成數值小數點誤差)
            player.nextLevelExp = Math.floor(100 * Math.pow(1.5, player.level - 1));
            player.exp = 0; // 當前經驗歸零
            
            // 🌟 額外懲罰：隨等級扣除一定比例的金幣 (每級增加 2% 掉落率，最高扣 50%)
            let coinLossRate = Math.min(0.5, player.level * 0.02);
            let lostCoins = Math.floor(player.coin * coinLossRate);
            player.coin -= lostCoins;

            addLog(`💀 <b style='color:red;'>你遭受了嚴重的死亡懲罰！失去了 ${levelsToLose} 個等級與 ${lostCoins} 枚金幣...</b>`);
        } else {
            // 只有 1 級時，扣除 50% 金幣
            player.exp = 0;
            let lostCoins = Math.floor(player.coin * 0.5);
            player.coin -= lostCoins;
            addLog(`💀 <b style='color:red;'>你復活了。作為代價你失去了所有的經驗與 ${lostCoins} 枚金幣。</b>`);
        }
    }

    // 3. 恢復狀態與 UI
    player.hp = player.maxHp;       // 滿血復活
    currentMonster = null;          // 怪物消失
    player.skills.fireballCD = 0;   // 重置技能 CD
    player.skills.lightningCD = 0;
    player.skills.healCD = 0;

    // 把按鈕變回原本的「探險按鈕」
    const exploreBtn = document.getElementById('explore-btn');
    exploreBtn.innerText = `🧭 開始探險 (💰 ${player.coin})`;
    exploreBtn.style.backgroundColor = "#7289da"; 
    exploreBtn.onclick = explore; 

    // 顯示商店
    const shopContainer = document.getElementById('shop-container');
    if(shopContainer) shopContainer.style.display = 'block';
    
    saveGame(); // 復活後強制存檔
    updateUI();
}
function deleteSave() {
    if (confirm("確定要刪除所有冒險進度嗎？這無法還原！")) {
        localStorage.removeItem('myRpgSave');
        location.reload(); // 重新整理網頁
    }
}

// 在原本的 updateUI() 之前加上這行
loadGame(); 
updateUI();