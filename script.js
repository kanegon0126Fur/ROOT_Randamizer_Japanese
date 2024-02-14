// 派閥とポイントの定義
const factions = {
    '猫野侯国': 10,
    '鷲巣王朝': 7,
    '森林連合': 3,
    '放浪部族': 5, // 注：放浪部族は特別な扱いが必要
    '河民商団': 5,
    '蜥蜴教団': 2,
    '地下公領': 8,
    '黒烏結社': 3,
    '百獣王国': 9,
    '甲鉄衛団': 8
};

const expansionFactions = {
    'さざめく河のけだもの軍記': ['河民商団', '蜥蜴教団'],
    'そびえる山のいきもの乱記': ['地下公領', '黒烏結社'],
    'みはてぬ宝のあらもの騒記': ['百獣王国', '甲鉄衛団']
};

// 必要な派閥ポイントの合計
const requiredPointsByPlayerCount = {
    '2': 17,
    '3': 18,
    '4': 21,
    '5': 25,
    '6': 28
};

// 複雑さに基づく派閥の制限
const complexityFactions = {
    'low': ['猫野侯国', '鷲巣王朝', '黒烏結社'],
    'medium': ['放浪部族', '地下公領', '百獣王国', '放浪部族(2人目)'],
    'high': ['森林連合', '河民商団', '蜥蜴教団', '甲鉄衛団']
};

document.getElementById('playerCount').addEventListener('change', function() {
    generateComplexityChoices();
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('playerComplexityChoices').addEventListener('change', function(e) {
        if (e.target.name.startsWith('complexityP')) {
            const playerIndex = e.target.name.match(/\d+/)[0]; // プレイヤー番号を取得
            const allCheckbox = document.querySelector(`input[name="complexityP${playerIndex}"][value="all"]`);
            const otherCheckboxes = Array.from(document.querySelectorAll(`input[name="complexityP${playerIndex}"]:not([value="all"])`));
            
            if (e.target.value === "all" && e.target.checked) {
                // 「全ての複雑さ」がチェックされたら、他のチェックボックスをクリア
                otherCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            } else if (otherCheckboxes.some(checkbox => checkbox.checked)) {
                // 「低」「中」「高」のいずれかがチェックされたら、「全ての複雑さ」のチェックを外す
                allCheckbox.checked = false;
            }
        }
    });
});

document.getElementById('complexityAdjustment').addEventListener('change', function() {
    const complexityOptionsDiv = document.getElementById('complexityOptions');
    complexityOptionsDiv.style.display = this.checked ? 'block' : 'none';
    generateComplexityChoices();
});

let selectedMercenaries = [];

let hasFirstWanderer = false;

document.getElementById('randomize').addEventListener('click', function() {
    // リセット処理
    selectedMercenaryCategories.clear();
    selectedMercenaries = [];
    hasFirstWanderer = false; 
    
    const playerCount = parseInt(document.getElementById('playerCount').value);
    const expansions = Array.from(document.querySelectorAll('input[name="expansion"]:checked')).map(e => e.value);
    let availableFactions = Object.assign({}, factions); // 利用可能な派閥のデフォルト設定

    // メカ野侯国の追加チェックボックスの状態を確認
    const addMekaNeko = document.getElementById('addMekaNeko').checked;
    if (addMekaNeko) {
        // 猫野侯国を除外
        delete availableFactions['猫野侯国'];
    }

    // 拡張に基づいて派閥を追加または除外
    Object.keys(expansionFactions).forEach(expansion => {
        if (expansions.includes(expansion)) {
            expansionFactions[expansion].forEach(faction => {
                availableFactions[faction] = factions[faction];
            });
        } else {
            expansionFactions[expansion].forEach(faction => {
                delete availableFactions[faction];
            });
        }
    });

    // プレイヤーごとの複雑さの選択を取得
    const playerComplexities = document.getElementById('complexityAdjustment').checked ? getPlayerComplexityChoices(playerCount) : Array(playerCount).fill(['all']);

    // 「傭兵隊を追加」チェックボックスの状態を確認
    const addMercenaries = document.getElementById('addMercenaries').checked;
    if (addMercenaries) {
        // 傭兵隊の追加と派閥の除外
        const totalPlayersIncludingNPC = playerCount + (addMekaNeko ? 1 : 0);
        selectedMercenaries = chooseAndExcludeMercenaries(totalPlayersIncludingNPC, availableFactions, addMekaNeko);
    }

    if (expansions.includes('さざめく河のけだもの軍記')) {
        // 「さざめく河のけだもの軍記」が選択されている場合、2人目の放浪部族を追加可能にする
        availableFactions['放浪部族(2人目)'] = 2; // 2人目の放浪部族のポイントを設定
    }

    // メカ野侯国を追加した場合のポイント調整
    let requiredPoints = requiredPointsByPlayerCount[playerCount]; // メカ野侯国を追加する前のプレイヤー数に基づく必要ポイント
    if (addMekaNeko) {
        // メカ野侯国のポイント+10を考慮
        requiredPoints += -9; // メカ野侯国のポイントを加算
    }

    // ランダマイズ処理
    const assignedFactions = findValidCombinations(availableFactions, requiredPoints, playerCount, expansions, playerComplexities);

    // メカ野侯国を結果に追加
    if (addMekaNeko) {
        assignedFactions.unshift('NPC：メカ野侯国');
    }

    // 結果の表示
    displayResults(assignedFactions.concat(selectedMercenaries.map(mercenary => "傭兵隊：" + mercenary)));
});


function chooseAndExcludeMercenaries(playerCount, availableFactions, excludeA) {
    let mercenariesToAdd = [];
    switch (playerCount) {
        case 2:
            mercenariesToAdd = chooseMercenaries('U', 3, excludeA);
            break;
        case 3:
            mercenariesToAdd = chooseMercenaries('U', 2, excludeA).concat(chooseMercenaries('D', 1, excludeA));
            break;
        case 4:
            mercenariesToAdd = chooseMercenaries('U', 1, excludeA).concat(chooseMercenaries('D', 2, excludeA));
            break;
        default: // 5人以上
            mercenariesToAdd = chooseMercenaries('D', 3, excludeA);
            break;
    }

    // 選ばれた傭兵隊に応じて利用可能な派閥を除外
    mercenariesToAdd.forEach(mercenary => {
        const category = mercenary.charAt(0); // 'A', 'B', 'C', 'D'
        switch (category) {
            case 'A':
                delete availableFactions['猫野侯国'];
                break;
            case 'B':
                delete availableFactions['鷲巣王朝'];
                break;
            case 'C':
                delete availableFactions['森林連合'];
                break;
            case 'D':
                delete availableFactions['放浪部族'];
                delete availableFactions['放浪部族(2人目)'];
                break;
        }
    });

    return mercenariesToAdd; // 選ばれた傭兵隊を返す
}

let selectedMercenaryCategories = new Set(); // 選択された傭兵隊のカテゴリーを追跡するセット

function chooseMercenaries(type, count, excludeA) {
    let uOptions = ['A:森林巡察隊', 'B:最後の王族', 'C:春の反乱軍', 'D:追放者'];
    let dOptions = ['A:ねこねこ医師団', 'B:高貴なる青い鳥', 'C:うさうさ偵察隊', 'D:大山賊'];
    let options = type === 'U' ? uOptions : dOptions;

    if (excludeA) {
        options = options.filter(option => !option.startsWith('A')); // メカ野侯国が追加された場合、Aカテゴリーを除外
    }

    // すでに選択されたカテゴリーを除外
    options = options.filter(option => !selectedMercenaryCategories.has(option.charAt(0)));

    let selected = [];

    while (selected.length < count && options.length > 0) {
        const randomIndex = Math.floor(Math.random() * options.length);
        const choice = options[randomIndex];
        const category = choice.charAt(0); // カテゴリーを取得（A, B, C, D）

        if (!selectedMercenaryCategories.has(category)) {
            selected.push(choice);
            selectedMercenaryCategories.add(category); // 選択されたカテゴリーを追加

            // 選択後、そのカテゴリーのオプションを削除して重複を避ける
            options = options.filter(option => option.charAt(0) !== category);
        }
    }

    return selected;
}

function generateComplexityChoices() {
    const playerCount = document.getElementById('playerCount').value;
    const playerComplexityChoicesDiv = document.getElementById('playerComplexityChoices');
    playerComplexityChoicesDiv.innerHTML = ''; // 既存の内容をクリア

    for (let i = 1; i <= playerCount; i++) {
        const complexityHtml = `
            <div>プレイヤー${i}:
                <label><input type="checkbox" name="complexityP${i}" value="all" checked>全ての複雑さ</label>
                <label><input type="checkbox" name="complexityP${i}" value="low">低</label>
                <label><input type="checkbox" name="complexityP${i}" value="medium">中</label>
                <label><input type="checkbox" name="complexityP${i}" value="high">高</label>
            </div>
        `;
        playerComplexityChoicesDiv.innerHTML += complexityHtml;
    }
    // 「複雑さを調整」がチェックされていない場合、全ての複雑さ選択肢を非表示に
    if (!document.getElementById('complexityAdjustment').checked) {
        Array.from(document.querySelectorAll('input[name^="complexityP"]:not([value="all"])')).forEach(input => {
            input.parentElement.style.display = 'none';
        });
    } else {
        Array.from(document.querySelectorAll('input[name^="complexityP"]:not([value="all"])')).forEach(input => {
            input.parentElement.style.display = 'inline';
        });
    }
}

function getPlayerComplexityChoices(playerCount) {
    let playerComplexities = [];
    for (let i = 1; i <= playerCount; i++) {
        let complexities = [];
        document.querySelectorAll(`input[name="complexityP${i}"]:checked`).forEach(input => {
            complexities.push(input.value);
        });
        playerComplexities.push(complexities);
    }
    return playerComplexities;
}

function filterFactionsByComplexity(allFactions, complexities) {
    let result = {};
    for (const [faction, points] of Object.entries(allFactions)) {
        complexities.forEach(complexity => {
            if (complexity === 'all' || complexityFactions[complexity].includes(faction)) {
                result[faction] = points;
            }
        });
    }
    return result;
}

function findValidCombinations(availableFactions, requiredPoints, playerCount, selectedExpansions, playerComplexities) {
    let attempts = 0;
    const maxAttempts = 1000; // 無限ループを避けるための最大試行回数
    let validCombination = [];

    while (attempts < maxAttempts && validCombination.length === 0) {
        let combinations = [];
        let pointsSum = 0;
        let tempAvailableFactions = {...availableFactions};
        hasFirstWanderer = false; // この関数の呼び出しのたびにリセット

        for (let i = 0; i < playerCount; i++) {
            let filteredFactions = filterFactionsByComplexity(tempAvailableFactions, playerComplexities[i]);
            let factionNames = Object.keys(filteredFactions);

            if (factionNames.length === 0) {
                break; // フィルタリング後の選択肢がなければ終了
            }

            let faction;
            let randomIndex = Math.floor(Math.random() * factionNames.length);
            faction = factionNames[randomIndex];

            // 放浪部族(2人目)を選択しようとしたが、まだ放浪部族が選ばれていない場合、選択をスキップ
            if (faction === '放浪部族(2人目)' && !hasFirstWanderer) {
                continue; // 次の試行へ
            }

            pointsSum += filteredFactions[faction];
            combinations.push(faction);

            // 放浪部族が選ばれた場合、フラグを更新
            if (faction === '放浪部族') {
                hasFirstWanderer = true;
            }

            // 選ばれた派閥を次の選択肢から削除
            delete tempAvailableFactions[faction];
        }

        if (pointsSum >= requiredPoints && combinations.length === playerCount) {
            validCombination = combinations;
        }

        attempts++;
    }

    if (validCombination.length > 0) {
        return validCombination;
    } else {
        return ["条件を満たす派閥の組み合わせが見つかりませんでした。"];
    }
}


function displayResults(factions) {
    setTimeout(() => {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = ''; // 結果表示エリアをクリア

        let html = '';

        // NPCのチェック
        if (factions[0] && factions[0].startsWith('NPC')) {
            html += `<div>${factions.shift()}</div>`; // NPCの表示
        }

        // プレイヤーの派閥割り当て結果を表示
        factions.forEach((faction, index) => {
            if (!faction.startsWith('傭兵隊：')) { // 傭兵隊の項目を除外
                html += `<div>プレイヤー${index + 1}: ${faction}</div>`;
            }
        });

        // 傭兵隊の情報が存在する場合、それを表示する
        if (selectedMercenaries.length > 0) {
            html += '<div style="margin-top: 10px;">傭兵隊の結果:</div>'; // 傭兵隊表示部分の開始
            selectedMercenaries.forEach((mercenary, index) => {
                html += `<div>傭兵隊${index + 1}: ${mercenary}</div>`;
            });
        }

        // 最終的なHTMLを結果表示エリアにセット
        resultsDiv.innerHTML = html;

        // フェードイン処理
        requestAnimationFrame(() => {
            resultsDiv.style.opacity = 0; // すぐに不透明度を0に設定
            requestAnimationFrame(() => {
                resultsDiv.style.opacity = 1; // 不透明度を1に設定してフェードイン
            });
        });
    }, 100); // CSSのトランジション時間に合わせて遅延を設定
}