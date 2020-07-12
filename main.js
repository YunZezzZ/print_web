const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');

onload = () => {
    ipcRenderer.send("getPrinterList");
    //回调
    ipcRenderer.once("getPrinterList", function(event, arg) {
        ipcRenderer.send("log", "receive PrinterList ");
        ipcRenderer.send("log", arg);
        if(arg === null || arg === "") {
           console.log("log", "printer list is null");
        }
        arg.forEach(element => {
                addItem(element.name, element.description, element.isDefault);
            });
    });

    // 鼠标移动到最小化上按钮背景色变化
    var btn = document.getElementById('minimize');
    btn.onmouseover = function () {
        this.style.backgroundColor = '#E5E9EC';
        this.style.color = '#000';
    };
    btn.onmouseout = function () {
        this.style.backgroundColor = '';
        this.style.color = '';
    };

    // 鼠标移动到关闭上按钮背景色变化
    var btn = document.getElementById('closeWin');
    btn.onmouseover = function () {
        this.style.backgroundColor = '#E5E9EC';
        this.style.color = '#000';
    };
    btn.onmouseout = function () {
        this.style.backgroundColor = '';
        this.style.color = '';
    };

    var titleImg = document.getElementById("titleImg");
    titleImg.src = path.join(__dirname, "/img/Cat.png");
};

function addItem(name,description,isdefault) {
    var tOption = document.createElement("Option");
    if(process.platform == 'darwin'){
        tOption.text = description;
        tOption.value = description;
    }else{
        tOption.text = name;
        tOption.value = name;
    }
    tOption.selected = isdefault;
    document.getElementById("printers").add(tOption);
}

//打印
function printFiles() {
   var printer = document.getElementById("printers").value;
   ipcRenderer.send("printFiles", printer);
}

//最小化功能
function minimize() {
    console.log("minimize");
    ipcRenderer.send("minimize");
}

function closeWin() {
    ipcRenderer.send("closeWin")
}
