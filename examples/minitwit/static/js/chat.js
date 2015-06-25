// 请将 AppId 改为你自己的 AppId，否则无法本地测试
//var appId = 'j1ax3y6bn2vt7r2uunt5vofnf7tdm1do6pl54ksly3lwyri4';

// 请换成你自己的一个房间的 conversation id（这是服务器端生成的）
//var roomId = '557e4c24e4b007f322b3eb72';

// 每个客户端自定义的 id
//var clientId = 'Alancer';

// 用来存储 realtimeObject
var rt;

// 用来存储创建好的 roomObject
var room;

// 监听是否服务器连接成功
var firstFlag = true;

// 用来标记历史消息获取状态
var logFlag = false;

//var openBtn = document.getElementById('open-btn');
var sendBtn = document.getElementById('send-btn');
var inputName = document.getElementById('input-name');
var inputSend = document.getElementById('input-send');
var printWall = document.getElementById('print-wall');

// 拉取历史相关
// 最早一条消息的时间戳
var msgTime;

//bindEvent(openBtn, 'click', main);
bindEvent(sendBtn, 'click', sendMsg);

bindEvent(document.body, 'keydown', function(e) {
    if (e.keyCode === 13) {
        if (firstFlag) {
            main();
        } else {
            sendMsg();
        }
    }
});

main();

function main() {
    showLog('正在链接服务器，请等待。。。');
    /*
    var val = inputName.value;
    if (val) {
        clientId = val;
    }
    */
    if (!firstFlag) {
        rt.close();
    }

    // 创建实时通信实例
    rt = AV.realtime({
        appId: appId,
        clientId: clientId,

        // 请注意，这里关闭 secure 完全是为了 Demo 兼容范围更大些
        // 具体请参考实时通信文档中的「其他兼容问题」部分
        // 如果真正使用在生产环境，建议不要关闭 secure，具体阅读文档
        // secure 设置为 true 是开启
        secure: false
    });

    // 监听连接成功事件
    rt.on('open', function() {
        firstFlag = false;
        showLog('服务器连接成功！');

        // 获得已有房间的实例
        rt.room(roomId, function(object) {

            // 判断服务器端是否存在这个 room，如果存在
            if (object) {
                room = object;

                // 当前用户加入这个房间
                room.join(function() {

                    // 获取成员列表
                    room.list(function(data) {
                        showLog('当前 Conversation 的成员列表：', data);

                        // 获取在线的 client（Ping 方法每次只能获取 20 个用户在线信息）
                        rt.ping(data.slice(0, 20), function(list) {
                            showLog('当前在线的成员列表：', list);
                        });

                        var l = data.length;

                        // 如果超过 500 人，就踢掉一个。
                        if (l > 490) {
                            room.remove(data[30], function() {
                                showLog('人数过多，踢掉： ', data[30]);
                            });
                        }

                        // 获取聊天历史
                        getLog(function() {
                            printWall.scrollTop = printWall.scrollHeight;
                            showLog('已经加入，可以开始聊天。');
                        });
                    });

                });

                // 房间接受消息
                room.receive(function(data) {
                    if (!msgTime) {
                        // 存储下最早的一个消息时间戳
                        msgTime = data.timestamp;
                    }
                    showMsg(data);
                    printWall.scrollTop = printWall.scrollHeight;
                });
            }
            // 如果服务器端不存在这个 conversation
            else {
                showLog('服务器不存在这个 conversation，你需要创建一个。');

                // 创建一个新 room
                rt.room({
                    // Room 的默认名字
                    name: 'LeanCloud-Room',

                    // 默认成员的 clientId
                    members: [
                        // 当前用户
                        clientId
                    ],
                    // 创建暂态的聊天室（暂态聊天室支持无限人员聊天，但是不支持存储历史）
                    // transient: true,
                    // 默认的数据，可以放 Conversation 名字等
                    attr: {
                        test: 'demo2'
                    }
                }, function(obj) {

                    // 创建成功，后续你可以将 room id 存储起来
                    room = obj;
                    roomId = room.id;
                    showLog('创建一个新 Room 成功，id 是：', roomId);

                    // 关闭原连接，重新开启新连接
                    rt.close();
                    main();
                });
            }
        });
    });

    // 监听服务情况
    rt.on('reuse', function() {
        showLog('服务器正在重连，请耐心等待。。。');
    });

    // 监听错误
    rt.on('error', function() {
        showLog('连接遇到错误。。。');
    });
}

function sendMsg() {

    // 如果没有连接过服务器
    if (firstFlag) {
        alert('请先连接服务器！');
        return;
    }
    var val = inputSend.value;

    // 不让发送空字符
    if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
        alert('请输入点文字！');
    }

    // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
    room.send({
        text: val
    }, {
        type: 'text'
    }, function(data) {

        // 发送成功之后的回调
        inputSend.value = '';
        showLog('（' + formatTime(data.t) + '）  自己： ', val, false, true);
        printWall.scrollTop = printWall.scrollHeight;
    });

    // 发送多媒体消息，如果想测试图片发送，可以打开注释
    // room.send({
    //     text: '图片测试',
    //     // 自定义的属性
    //     attr: {
    //         a:123
    //     },
    //     url: 'https://leancloud.cn/images/static/press/Logo%20-%20Blue%20Padding.png',
    //     metaData: {
    //         name:'logo',
    //         format:'png',
    //         height: 123,
    //         width: 123,
    //         size: 888
    //     }
    // }, {
    //    type: 'image'
    // }, function(data) {
    //     console.log('图片数据发送成功！');
    // });
}

// 显示接收到的信息
function showMsg(data, isBefore) {
    var text = '';
    var from = data.fromPeerId;
    var isSelf = false
    if (data.msg.type) {
        text = data.msg.text;
    } else {
        text = data.msg;
    }
    if (data.fromPeerId === clientId) {
        from = '自己';
        isSelf = true;
    }
    if (String(text).replace(/^\s+/, '').replace(/\s+$/, '')) {
        showLog('（' + formatTime(data.timestamp) + '）  ' + encodeHTML(from) + '： ', text, isBefore, isSelf);
    }
}

// 拉取历史
bindEvent(printWall, 'scroll', function(e) {
    if (printWall.scrollTop < 20) {
        getLog();
    }
});

// 获取消息历史
function getLog(callback) {
    var height = printWall.scrollHeight;
    if (logFlag) {
        return;
    } else {
        // 标记正在拉取
        logFlag = true;
    }
    room.log({
        t: msgTime
    }, function(data) {
        logFlag = false;
        // 存储下最早一条的消息时间戳
        var l = data.length;
        if (l) {
            msgTime = data[0].timestamp;
        }
        for (var i = l - 1; i >= 0; i --) {
            showMsg(data[i], true);
        }
        if (l) {
            printWall.scrollTop = printWall.scrollHeight - height;
        }
        if (callback) {
            callback();
        }
    });
}

// demo 中输出代码
function showLog(msg, data, isBefore, isSelf) {
    if (data) {
        //console.log(msg, data);
        //msg = msg + '<span class="strong">' + encodeHTML(JSON.stringify(data)) + '</span>';
        if (isSelf) {
            msg = msg + '<div class="col-md-2 col-sm-2 col-xs-3">' + 
                        '  <a href="http://google.com">' +
                        '    <img class="img-responsive" src="' + myImage + '" width="40" height="40"/>' +
                        '  </a>' +
                        '</div>' +
                        '<div class="col-md-10 col-sm-10 col-xs-9">' +
                        '  <div class="bubble">' + 
                        '    <p>' + 
                               encodeHTML(JSON.stringify(data)) +
                        '    </p>' + 
                        '  </div>' + 
                        '</div>' +
                        '<div style="clear: both;"></div>';
        }
        else {
            msg = msg + '<div class="col-md-10 col-sm-10 col-xs-9">' + 
                        '  <div class="bubble bubble--alt">' +
                        '    <p>' +
                               encodeHTML(JSON.stringify(data)) +
                        '    </p>' +
                        '  </div>' +
                        '</div>' +
                        '<div class="col-md-2 col-sm-2 col-xs-3">' +
                        '  <a href="http://baidu.com">' +
                        '    <img class="img-responsive" src="' + otherImage + '" width="40" height="40"/>' +
                        '  </a>' +
                        '</div>' +
                        '<div style="clear: both;"></div>';
        }
    }
    var p = document.createElement('p');
    p.innerHTML = msg;
    if (isBefore) {
        printWall.insertBefore(p, printWall.childNodes[0]);
    } else {
        printWall.appendChild(p);
    }
}

function encodeHTML(source) {
    return String(source)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
        // .replace(/\\/g,'&#92;')
        // .replace(/"/g,'&quot;')
        // .replace(/'/g,'&#39;');
}

function formatTime(time) {
    var date = new Date(time);
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return date.getFullYear() + '-' + month + '-' + currentDate+' '+ hh + ':' + mm + ':' + ss;
}

function bindEvent(dom, eventName, fun) {
    if (window.addEventListener) {
        dom.addEventListener(eventName, fun);
    } else {
        dom.attachEvent('on' + eventName, fun);
    }
}