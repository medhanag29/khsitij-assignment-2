let board = [];
let rows, cols, mines;

let firstClick = true;
let gameOver = false;

let flags = 0;
let timer = 0;
let interval = null;

const settings = {
    easy: {
        rows: 9,
        cols: 9,
        mines: 10
    },
    medium: {
        rows: 16,
        cols: 16,
        mines: 40
    },
    hard: {
        rows: 16,
        cols: 30,
        mines: 99
    }
};

function initGame() {

    const diff = document.getElementById("difficulty").value;

    rows = settings[diff].rows;
    cols = settings[diff].cols;
    mines = settings[diff].mines;

    board = [];

    for (let r = 0; r < rows; r++) {

        let row = [];

        for (let c = 0; c < cols; c++) {

            row.push({
                mine:false,
                revealed:false,
                flagged:false,
                count:0
            });
        }

        board.push(row);
    }

    firstClick = true;
    gameOver = false;
    flags = 0;
    timer = 0;

    clearInterval(interval);

    document.getElementById("timer").textContent = 0;
    document.getElementById("message").textContent = "";

    renderBoard();
}

function placeMines(startRow,startCol){

    let placed = 0;

    while(placed < mines){

        let r = Math.floor(Math.random()*rows);
        let c = Math.floor(Math.random()*cols);

        if(board[r][c].mine) continue;

        if(Math.abs(r-startRow)<=1 &&
           Math.abs(c-startCol)<=1) continue;

        board[r][c].mine = true;
        placed++;
    }

    calculateNumbers();
}

function calculateNumbers(){

    for(let r=0;r<rows;r++){

        for(let c=0;c<cols;c++){

            if(board[r][c].mine) continue;

            let count = 0;

            for(let dr=-1;dr<=1;dr++){

                for(let dc=-1;dc<=1;dc++){

                    let nr=r+dr;
                    let nc=c+dc;

                    if(
                        nr>=0 &&
                        nc>=0 &&
                        nr<rows &&
                        nc<cols &&
                        board[nr][nc].mine
                    ){
                        count++;
                    }
                }
            }

            board[r][c].count = count;
        }
    }
}

function renderBoard(){

    const boardDiv = document.getElementById("board");

    boardDiv.innerHTML = "";

    boardDiv.style.gridTemplateColumns =
        `repeat(${cols},40px)`;

    board.forEach((row,r)=>{

        row.forEach((cell,c)=>{

            const btn = document.createElement("button");

            btn.classList.add("cell");

            if(cell.revealed){

                btn.classList.add("revealed");

                if(cell.mine){

                    btn.textContent="💣";
                    btn.classList.add("mine");
                }
                else if(cell.count>0){

                    btn.textContent=cell.count;
                    btn.classList.add(`n${cell.count}`);
                }
            }
            else if(cell.flagged){

                btn.textContent="🚩";
                btn.classList.add("flagged");
            }

            btn.addEventListener("click",()=>reveal(r,c));

            btn.addEventListener("contextmenu",(e)=>{
                e.preventDefault();
                toggleFlag(r,c);
            });

            boardDiv.appendChild(btn);
        });
    });

    document.getElementById("mineCount").textContent =
        mines - flags;
}

function reveal(r,c){

    if(gameOver) return;

    let cell = board[r][c];

    if(cell.revealed || cell.flagged) return;

    if(firstClick){

        placeMines(r,c);

        interval = setInterval(()=>{
            timer++;
            document.getElementById("timer").textContent = timer;
        },1000);

        firstClick = false;
    }

    cell.revealed = true;

    if(cell.mine){

        revealAllMines();

        gameOver = true;

        clearInterval(interval);

        document.getElementById("message").textContent =
            "💥 Game Over";

        updateStats(false);

        return;
    }

    if(cell.count===0){
        floodFill(r,c);
    }

    renderBoard();

    checkWin();
}

function floodFill(r,c){

    let queue = [[r,c]];

    while(queue.length){

        let [row,col] = queue.shift();

        for(let dr=-1;dr<=1;dr++){

            for(let dc=-1;dc<=1;dc++){

                let nr=row+dr;
                let nc=col+dc;

                if(
                    nr<0 || nc<0 ||
                    nr>=rows || nc>=cols
                ) continue;

                let neighbour = board[nr][nc];

                if(
                    !neighbour.revealed &&
                    !neighbour.mine &&
                    !neighbour.flagged
                ){

                    neighbour.revealed=true;

                    if(neighbour.count===0){
                        queue.push([nr,nc]);
                    }
                }
            }
        }
    }
}

function toggleFlag(r,c){

    if(gameOver) return;

    let cell = board[r][c];

    if(cell.revealed) return;

    cell.flagged = !cell.flagged;

    flags += cell.flagged ? 1 : -1;

    renderBoard();
}

function revealAllMines(){

    for(let r=0;r<rows;r++){

        for(let c=0;c<cols;c++){

            if(board[r][c].mine){
                board[r][c].revealed = true;
            }
        }
    }

    renderBoard();
}

function checkWin(){

    let revealed = 0;

    for(let r=0;r<rows;r++){

        for(let c=0;c<cols;c++){

            if(
                board[r][c].revealed &&
                !board[r][c].mine
            ){
                revealed++;
            }
        }
    }

    if(revealed === rows*cols - mines){

        gameOver = true;

        clearInterval(interval);

        document.getElementById("message").textContent =
            "🎉 Congratulations! You Won!";

        updateStats(true);
    }
}

function getStats(){

    return JSON.parse(
        localStorage.getItem("mineStats")
    ) || {
        played:0,
        won:0,
        bestEasy:null,
        bestMedium:null,
        bestHard:null
    };
}

function updateStats(win){

    let stats = getStats();

    stats.played++;

    if(win){

        stats.won++;

        let diff =
            document.getElementById("difficulty").value;

        let key =
            diff==="easy" ? "bestEasy" :
            diff==="medium" ? "bestMedium" :
            "bestHard";

        if(
            stats[key]===null ||
            timer < stats[key]
        ){
            stats[key] = timer;
        }
    }

    localStorage.setItem(
        "mineStats",
        JSON.stringify(stats)
    );

    showStats();
}

function showStats(){

    let stats = getStats();

    document.getElementById("gamesPlayed").textContent =
        stats.played;

    document.getElementById("winRate").textContent =
        stats.played
        ? ((stats.won/stats.played)*100).toFixed(1)
        : 0;

    document.getElementById("bestEasy").textContent =
        stats.bestEasy ?? "-";

    document.getElementById("bestMedium").textContent =
        stats.bestMedium ?? "-";

    document.getElementById("bestHard").textContent =
        stats.bestHard ?? "-";
}

document.getElementById("newGame")
.addEventListener("click",initGame);

document.getElementById("resetGame")
.addEventListener("click",initGame);

document.getElementById("resetStats")
.addEventListener("click",()=>{

    localStorage.removeItem("mineStats");
    showStats();
});

showStats();
initGame();