const {app, BrowserWindow, Menu, Tray, ipcMain} = require('electron');
const path = require('path');
const request = require('request');
//主窗口
let indexWindow;
//显示窗口
let mainWindow;
let serverProcess = require('child_process');
let appTray = null;


app.on("ready", createIndexWindow);

function createIndexWindow() {
    let platform = process.platform;

    var jarPath = path.join(__dirname, "/jar/print.jar");

    if(jarPath.indexOf("app.asar") > 0){
        jarPath = jarPath.replace('app.asar', 'app.asar.unpacked');
    }
    console.log("java-jarPath="+jarPath);

    if(serverProcess == null){
        serverProcess = require('child_process');
    }

    var command = "java -jar " + "\"" + jarPath + "\"";
    console.log(command);
    serverProcess.exec(command);

    const windowOptions = {
        width: 450,
        height : 350,
        title: 'IndexWindow',
        show: false,
        webPreferences: {
            plugins: true,
            nodeIntegration: true,
            webviewTag: true
        }
    };
    indexWindow = new BrowserWindow(windowOptions);

    // indexWindow.webContents.openDevTools();

    handleAppTray(null);

    if (mainWindow == null) {
        createMainWindow();
    }

    indexWindow.on('closed', function(e) {
        indexWindow = null;
    });

    indexWindow.loadURL(`file://${__dirname}/index.html`)
}

function createMainWindow() {
    const windowOptions = {
        width: 450,
        height : 210,
        title: 'MainWindow',
        show: true,
        resizable:false,
        frame: false,
        webPreferences: {
            plugins: true,
            nodeIntegration: true,  // 解决require is not defined问题
            webviewTag: true  // 解决webview无法显示问题
        }
    };
    mainWindow = new BrowserWindow(windowOptions);

    mainWindow.on('closed', function (e) {
        console.log("---------------------window close---------------------")
        if (serverProcess) {
            e.preventDefault();

            // kill Java executable
            const kill = require('tree-kill');
            kill(serverProcess.pid, 'SIGTERM', function () {
                console.log('Server process killed');
                serverProcess = null;
                console.log('---------------------exe quit---------------------');
                mainWindow = null;
                //托盘处理
                if(appTray != null) {
                    appTray.destroy();
                }
                app.quit();
            });
        } else {
            console.log('---------------------exe quit---------------------');
            mainWindow = null;
            //托盘处理
            if(appTray != null) {
                appTray.destroy();
            }
            app.quit();
        }
    });

    mainWindow.loadURL(`file://${__dirname}/main.html`);
    //开发者工具（控制台）
    // mainWindow.webContents.openDevTools();
}

// 限制只可以打开一个应用
const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
    if (indexWindow) {
        mainWindow.focus();
        mainWindow.show();
    }
});

if (isSecondInstance) {
    app.quit()
}

//创建托盘
function handleAppTray(msg) {
    if (appTray != null) {
        appTray.destroy();
        appTray = null;
    }
    //系统托盘图标目录
    appTray = new Tray(path.join(__dirname, '/img/Cat.png'));
    //设置此托盘图标的悬停提示内容
    appTray.setToolTip('Printer');
    //系统托盘右键菜单
    var trayMenuTemplate = [
        {
            label: '设置',
            click: function () {
                if (mainWindow == null) {
                    createMainWindow();
                }else{
                    mainWindow.show();
                }
            }
        },
        {
            label: '退出',
            click: function () {
                mainWindow.close();
            }
        }
    ];
    //图标的上下文菜单
    const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);
    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);
    if(msg != null && msg !== "") {
        appTray.displayBalloon({title:"Tray", content:msg});
    }
}

//主进程监听
ipcMain.on("getPrinterList", function (event, arg) {
    console.log("listen getPrinterList");
    if(mainWindow == null) {
        createMainWindow();
    }
    var list = mainWindow.webContents.getPrinters();

    mainWindow.webContents.send('getPrinterList', list);
});

ipcMain.on("log", function (event, arg) {
    console.log(arg);
});

ipcMain.on("minimize", function (event, args) {
    mainWindow.minimize();
});

ipcMain.on("closeWin", function (event, args) {
    mainWindow.close();
});

ipcMain.on("printFiles", function (event, args) {
    console.log("ipcMain receive printFiles");
    console.log("printer is " + args);
    console.log("begin print");
    handleAppTray("开始");
    request.get({
        url: 'http://localhost:8080/print/printByPrinterName?printer='+ args,
    }, function (err, httpResponse, body) {
        if (err) {
            console.log("unknown error when print");
            handleAppTray("请求失败");
        } else {
            if (body.data === "failed") {
                console.log("print failed");
                handleAppTray("服务端发生异常");
            }  else {
                console.log("print success");
                handleAppTray("完成");
            }
        }
    });
});
