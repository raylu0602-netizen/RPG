// ==========================================
// 🃏 維度大老二：全系統整合版 (poker.js)
// ==========================================

// --- 1. 全域常量與狀態 ---
const RANK_ORDER = {'3':0, '4':1, '5':2, '6':3, '7':4, '8':5, '9':6, '10':7, 'J':8, 'Q':9, 'K':10, 'A':11, '2':12};
const SUIT_ORDER = {'♣': 0, '♦': 1, '♥': 2, '♠': 3};
let cardIdCounter = 0; // 全域 ID 計數器

let pokerGame = {
    deck: [],          // 剩餘牌堆 (Boss 的虛擬牌庫)
    playerHand: [],    // 玩家手牌
    selectedCards: [], // 玩家當前選取的牌
    bossHandCount: 13, // Boss 剩餘張數
    tableCards: null,  // 桌面上的牌 (PokerHand 物件)
    isPractice: false  // 是否為練習模式
};

// --- 2. 核心類別 ---
class PokerCard {
    constructor(rank, suit, id) {
        this.rank = rank;
        this.suit = suit;
        this.id = id; 
        this.power = RANK_ORDER[rank] * 4 + SUIT_ORDER[suit];
    }
    toString() { return `${this.suit}${this.rank}`; }
}

class PokerHand {
    static INVALID = -1;
    static SINGLE = 1;
    static PAIR = 2;
    static STRAIGHT = 4;
    static FULL_HOUSE = 6;

    constructor(cards) {
        this.cards = [...cards].sort((a, b) => a.power - b.power);
        this.type = PokerHand.INVALID;
        this.maxCard = null;
        this.evaluate();
    }

    evaluate() {
        const len = this.cards.length;
        let rankCounts = {};
        this.cards.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
        let counts = Object.values(rankCounts).sort((a, b) => b - a);

        if (len === 1) {
            this.type = PokerHand.SINGLE;
            this.maxCard = this.cards[0];
        } else if (len === 2 && counts[0] === 2) {
            this.type = PokerHand.PAIR;
            this.maxCard = this.cards[1];
        } else if (len === 5) {
            if (this.isStraight()) {
                this.type = PokerHand.STRAIGHT;
                this.maxCard = this.cards[4];
            } else if (counts[0] === 3 && counts[1] === 2) {
                this.type = PokerHand.FULL_HOUSE;
                let tripleRank = Object.keys(rankCounts).find(key => rankCounts[key] === 3);
                let tripleCards = this.cards.filter(c => c.rank === tripleRank);
                this.maxCard = tripleCards[tripleCards.length - 1]; 
            }
        }
    }

    isStraight() {
        if (this.cards.length !== 5) return false;
        let uniqueRanks = new Set(this.cards.map(c => c.rank));
        if (uniqueRanks.size !== 5) return false;
        let powers = this.cards.map(c => RANK_ORDER[c.rank]).sort((a, b) => a - b);
        if (powers[4] - powers[0] === 4) return true;
        for (let s = 1; s < 5; s++) {
            let shifted = powers.map((p, j) => j < s ? p + 13 : p).sort((a, b) => a - b);
            if (shifted[4] - shifted[0] === 4) return true;
        }
        return false;
    }

    beats(otherHand) {
        if (this.type === PokerHand.INVALID) return false;
        if (!otherHand) return true;
        if (this.type !== otherHand.type) return false;
        return this.maxCard.power > otherHand.maxCard.power;
    }
}

// --- 3. 遊戲初始化 ---
function initializePokerGame() {
    pokerGame.deck = [];
    pokerGame.playerHand = [];
    pokerGame.selectedCards = [];
    pokerGame.bossHandCount = 13;
    pokerGame.tableCards = null;
    cardIdCounter = 0;

    const suits = ['♣', '♦', '♥', '♠'];
    const ranks = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'];
    
    for (let suit of suits) {
        for (let rank of ranks) {
            pokerGame.deck.push(new PokerCard(rank, suit, cardIdCounter++));
        }
    }

    // 洗牌 (Fisher-Yates)
    for (let i = pokerGame.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pokerGame.deck[i], pokerGame.deck[j]] = [pokerGame.deck[j], pokerGame.deck[i]];
    }

    // 發 13 張給玩家
    for (let i = 0; i < 13; i++) pokerGame.playerHand.push(pokerGame.deck.pop());

    // Boss 藏一張 2 (作弊模式)
    if (!pokerGame.isPractice) {
        let cheatIdx = pokerGame.deck.findIndex(c => c.rank === '2' && (c.suit === '♠' || c.suit === '♥'));
        if (cheatIdx > -1) {
            let cheatCard = pokerGame.deck.splice(cheatIdx, 1)[0];
            pokerGame.deck.unshift(cheatCard); 
        }
    }

    pokerGame.playerHand.sort((a, b) => a.power - b.power);
    const cheatSection = document.getElementById('cheat-skills-section');
    if (cheatSection) {
        cheatSection.style.display = pokerGame.isPractice ? 'none' : 'block';
    }
    renderPokerTable();
    addLog(`🃏 牌局開始！${pokerGame.isPractice ? "【修煉模式】禁用技能。" : "【次元挑戰】可以使用干涉技能。"}`);
}

function startPokerPractice() {
    pokerGame.isPractice = true;
    document.getElementById('poker-arena-panel').style.display = 'block';
    document.getElementById('cheat-skills-section').style.display = 'none'; // 隱藏出千
    initializePokerGame();
}

// --- 4. 渲染與交互 ---
function renderPokerTable() {
    const handDiv = document.getElementById('player-hand');
    const tableDiv = document.getElementById('table-cards');
    if (!handDiv || !tableDiv) return;

    // 渲染手牌
    handDiv.innerHTML = ''; 
    pokerGame.playerHand.forEach((card, index) => {
        let isSelected = pokerGame.selectedCards.some(c => c.id === card.id);
        let color = (card.suit === '♥' || card.suit === '♦') ? '#e74c3c' : '#2c3e50';
        let style = isSelected ? "transform: translateY(-15px); box-shadow: 0 0 10px #f1c40f; border: 2px solid #f1c40f;" : "border: 1px solid #bdc3c7;";

        handDiv.innerHTML += `
            <span onclick="toggleCardSelection(${index})" style="display: inline-block; background: white; color: ${color}; padding: 15px 20px; margin: 2px; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.2s; ${style}">
                ${card.suit}${card.rank}
            </span>`;
    });

    // 渲染桌面
    if (pokerGame.tableCards) {
        tableDiv.innerHTML = pokerGame.tableCards.cards.map(c => {
            let color = (c.suit === '♥' || c.suit === '♦') ? '#e74c3c' : '#2c3e50';
            return `<span style="display: inline-block; background: white; color: ${color}; padding: 10px 15px; margin: 2px; border-radius: 5px; border: 1px solid #bdc3c7; font-weight: bold;">${c.suit}${c.rank}</span>`;
        }).join('');
    } else {
        tableDiv.innerHTML = '<span style="color: #a5d6a7;">(等待出牌)</span>';
    }

    // 按鈕區
    let btnHTML = '<div style="margin-top: 20px;">';
    if (pokerGame.selectedCards.length > 0) {
        btnHTML += `<button onclick="playSelectedCards()" style="background:#27ae60; color:white; padding:10px 20px; border-radius:5px; font-weight:bold; cursor:pointer;">🃏 出牌 (${pokerGame.selectedCards.length}張)</button>`;
        btnHTML += `<button onclick="pokerGame.selectedCards=[]; renderPokerTable();" style="background:#7f8c8d; color:white; padding:10px 20px; border-radius:5px; margin-left:10px; cursor:pointer;">取消</button>`;
    }
    if (pokerGame.isPractice) {
        btnHTML += `<button onclick="exitPokerGame()" style="background:#c0392b; color:white; padding:10px 20px; border-radius:5px; margin-left:10px; cursor:pointer;">🚪 結束練習</button>`;
    }
    btnHTML += '</div>';
    handDiv.innerHTML += btnHTML;

    document.getElementById('boss-card-count').innerText = pokerGame.bossHandCount;
}

function toggleCardSelection(index) {
    let card = pokerGame.playerHand[index];
    let sIdx = pokerGame.selectedCards.findIndex(c => c.id === card.id);
    if (sIdx > -1) pokerGame.selectedCards.splice(sIdx, 1);
    else if (pokerGame.selectedCards.length < 5) pokerGame.selectedCards.push(card);
    renderPokerTable();
}

function playSelectedCards() {
    let hand = new PokerHand(pokerGame.selectedCards);
    if (hand.type === PokerHand.INVALID) {
        addLog("❌ <b style='color:red;'>無效牌型！</b>");
        return;
    }
    if (pokerGame.tableCards && !hand.beats(pokerGame.tableCards)) {
        addLog("❌ <b style='color:red;'>牌太小了！</b>");
        return;
    }

    pokerGame.tableCards = hand;
    pokerGame.playerHand = pokerGame.playerHand.filter(c => !pokerGame.selectedCards.some(sc => sc.id === c.id));
    pokerGame.selectedCards = [];
    addLog(`✅ 你打出了 ${hand.maxCard.toString()} 的牌組。`);
    
    renderPokerTable();
    if (checkPokerWin()) return;
    setTimeout(bossPlay, 600);
}

// --- 5. AI 與 技能 ---
function bossPlay() {
    addLog("👁️ <b style='color:#9b59b6;'>維度賭徒正在觀測可能性...</b>");

    // 技能判定 (練習模式不發動)
    if (!pokerGame.isPractice) {
        if (Math.random() < 0.15 && pokerGame.playerHand.length > 0) { // 等價交換
            pokerGame.playerHand.sort((a, b) => a.power - b.power);
            let stolen = pokerGame.playerHand.pop();
            pokerGame.deck.sort((a, b) => a.power - b.power);
            let trash = pokerGame.deck.shift();
            pokerGame.playerHand.push(trash);
            pokerGame.deck.push(stolen);
            pokerGame.playerHand.sort((a, b) => a.power - b.power);
            pokerGame.tableCards = null; // 技能視為 PASS 並清場
            addLog(`⚡ <b style='color:#8e44ad;'>【等價交換】</b>Boss 偷走你的 ${stolen.toString()} 並塞給你 ${trash.toString()}！`);
            renderPokerTable(); return;
        }
        if (pokerGame.playerHand.length <= 2 && Math.random() < 0.25) { // 維度增生
            pokerGame.playerHand.push(new PokerCard('3', '♣', cardIdCounter++));
            pokerGame.playerHand.push(new PokerCard('4', '♦', cardIdCounter++));
            pokerGame.playerHand.sort((a, b) => a.power - b.power);
            pokerGame.tableCards = null; 
            addLog(`⚡ <b style='color:#c0392b;'>【維度增生】</b>Boss 強行往你手裡塞了兩張幻影卡片！`);
            renderPokerTable(); return;
        }
    }

    // AI 出牌
    let move = findValidMoveFast(pokerGame.deck, pokerGame.tableCards);
    if (move === "PASS" || !move) {
        addLog("🃏 【維度賭徒】選擇了 <b style='color:#7f8c8d;'>PASS</b>！發球權回歸。");
        pokerGame.tableCards = null;
    } else {
        pokerGame.tableCards = move;
        move.cards.forEach(mc => {
            let idx = pokerGame.deck.findIndex(c => c.id === mc.id);
            if(idx > -1) pokerGame.deck.splice(idx, 1);
        });
        pokerGame.bossHandCount -= move.cards.length;
        addLog(`🃏 【維度賭徒】打出了 ${move.maxCard.toString()} 相關牌組。`);
    }

    renderPokerTable();
    checkPokerWin();
}

// 移植 Python 版光速 AI
function findValidMoveFast(hand, lastHand) {
    let n = lastHand ? lastHand.cards.length : 0;
    let sorted = [...hand].sort((a, b) => a.power - b.power);
    let isThreat = pokerGame.playerHand.length <= 2;

    if (n === 0) { // 首攻
        let straights = findAllStraights(sorted); if(straights.length) return straights[0];
        let fullHouses = findAllFullHouses(sorted); if(fullHouses.length) return fullHouses[0];
        let { pairs } = getComponents(sorted); 
        if(pairs.length) return new PokerHand(sorted.filter(c => c.rank === pairs[0]).slice(0, 2));
        return new PokerHand([sorted[0]]);
    }

    if (n === 1) { // 壓單張
        let searchList = isThreat ? [...sorted].reverse() : sorted;
        for (let c of searchList) {
            let cand = new PokerHand([c]);
            if (cand.beats(lastHand)) {
                if (!isThreat && c.rank === '2' && sorted.length > 5) continue; // 沒威脅時保留 2
                return cand;
            }
        }
    } else if (n === 2) { // 壓對子
        let { pairs } = getComponents(sorted);
        for (let r of pairs) {
            let cand = new PokerHand(sorted.filter(c => c.rank === r).slice(0, 2));
            if (cand.beats(lastHand)) return cand;
        }
    } else if (n === 5) { // 壓五張
        let cands = lastHand.type === PokerHand.STRAIGHT ? findAllStraights(sorted) : findAllFullHouses(sorted);
        for (let c of cands) if (c.beats(lastHand)) return c;
    }
    return "PASS";
}

// --- AI 輔助找牌 ---
function getComponents(hand) {
    let c = {}; hand.forEach(x => c[x.rank] = (c[x.rank] || 0) + 1);
    return { pairs: Object.keys(c).filter(r => c[r] >= 2), triples: Object.keys(c).filter(r => c[r] >= 3) };
}
function findAllStraights(hand) {
    let res = [], cycle = ['3','4','5','6','7','8','9','10','J','Q','K','A','2','3','4','5','6'];
    let map = {}; hand.forEach(c => (map[c.rank] = map[c.rank] || []).push(c));
    for (let i = 0; i <= cycle.length - 5; i++) {
        let temp = cycle.slice(i, i + 5);
        if (temp.every(r => map[r] && map[r].length)) res.push(new PokerHand(temp.map(r => map[r][0])));
    }
    return res;
}
function findAllFullHouses(hand) {
    let { pairs, triples } = getComponents(hand), res = [];
    triples.forEach(t => pairs.forEach(p => {
        if(t !== p) res.push(new PokerHand([...hand.filter(c => c.rank === t).slice(0,3), ...hand.filter(c => c.rank === p).slice(0,2)]));
    }));
    return res;
}

// --- 6. 出千與結算 ---
function cheatTransformCard() {
    let cost = 1000000000000;
    if (player.coin < cost) { addLog("❌ 金幣不足！"); return; }
    if (pokerGame.selectedCards.length !== 1) { addLog("⚠️ 請選取一張牌！"); return; }
    
    player.coin -= cost;
    let target = pokerGame.selectedCards[0];
    target.rank = '2'; target.suit = '♠';
    target.power = RANK_ORDER['2'] * 4 + SUIT_ORDER['♠'];
    pokerGame.selectedCards = [];
    pokerGame.playerHand.sort((a, b) => a.power - b.power);
    addLog("⚡ 現實扭曲：手牌變更為 ♠2！");
    renderPokerTable(); updateUI();
}

function cheatForcePass() {
    let cost = 500000000000;
    if (player.coin < cost) { addLog("❌ 金幣不足！"); return; }
    if (!pokerGame.tableCards) return;
    player.coin -= cost;
    pokerGame.tableCards = null;
    addLog("⚡ 絕對威壓：強制 Boss PASS！");
    renderPokerTable(); updateUI();
}

function checkPokerWin() {
    if (pokerGame.playerHand.length === 0) {
        if (!pokerGame.isPractice) {
            addLog("🎊 <b style='color:#f1c40f;'>【次元勝利】</b>獲得 10兆金幣與 5億經驗！");
            player.coin += 10000000000000; player.exp += 500000000;
            player.towerFloor++;
        } else { addLog("🎊 練習勝利！"); }
        setTimeout(exitPokerGame, 1500); 
        exitPokerGame();
        return true;
        
    }
    if (pokerGame.bossHandCount <= 0) {
        if (!pokerGame.isPractice) {
            addLog("💀 靈魂被吞噬...");
            setTimeout(() => {
                player.hp = 0;
                if (typeof revive === 'function') revive();
                exitPokerGame(); // 輸了也要關掉牌桌
            }, 1000);
        } else { addLog("💀 練習失敗！"); setTimeout(exitPokerGame, 1500); }
        exitPokerGame();
        return true;
    }
    return false;
}

function exitPokerGame() {
    const pokerPanel = document.getElementById('poker-arena-panel');
    if (pokerPanel) pokerPanel.style.display = 'none';

    // 2. 讓原本的「探索」或「戰鬥」按鈕回來
    // 💡 請確認你的按鈕 ID 是否為 'explore-btn'
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.style.display = 'inline-block';
        // 如果你現在是在第 200 層贏了，更新按鈕文字
        if (!pokerGame.isPractice) {
            exploreBtn.innerText = `🧭 前往第 ${player.towerFloor} 層`;
        }
    }

    // 3. 核心：把 Boss (當前怪物) 設為 null，這樣 updateUI 才會隱藏 Boss 圖片
    if (typeof currentMonster !== 'undefined') {
        currentMonster = null;
    }

    // 4. 重置牌局狀態，避免下次進來牌沒清空
    pokerGame.tableCards = null;
    pokerGame.selectedCards = [];
    pokerGame.isPractice = false;

    // 5. 刷新主介面 (這一步會讓 Boss 血條和圖片消失)
    if (typeof updateUI === 'function') {
        updateUI();
    }

    addLog("✨ <b style='color:#3498db;'>牌局結束，回到冒險世界。</b>");
}