var db,
    request,
    indexedDB =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB ||
        window.shimIndexedDB,
    baseName = "Files",
    storeName = "Store",
    storeId = "Id";

var dropContainer = document.getElementById("boxDrop");

dropContainer.ondragover = function () {
    addHover(this);
    return false;
};
dropContainer.ondragleave = function () {
    removeHover(this);
    return false;
};
dropContainer.ondragend = function () {
    removeHover(this);
    return false;
};
dropContainer.ondrop = function (e) {
    removeHover(this);
    e.preventDefault();
    if (e.dataTransfer.files.length == 1) {
        $("#boxUpload").show();
        $(".waiting").show();
        readfiles(e.dataTransfer.files);
    }
};

$(document).on("change", "#fileSelect", function () {
    var f = $("#fileSelect")[0];
    if (f.files.length == 1) {
        $("#boxUpload").show();
        $(".waiting").show();
        readfiles(f.files);
    } else {
        $(".waiting").hide();
    }
});

function readfiles(files) {
    if (files.length == 1) {
        var file = files[0];
        $(".file-title").html(`${file.name} | (${bytesToSize(file.size)})`);
        var reader = new FileReader();
        reader.onload = function () {
            var arrayBuffer = this.result;
            var array = new Uint8Array(arrayBuffer);
            //   var json = JSON.stringify(array);
            //   localStorage.setItem("file", json);
            addRow({
                fileId: uuid(),
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileBytes: array,
                part: 0,
                isStarted: false
            });
        };
        reader.readAsArrayBuffer(file);

        // const retrievedArr = JSON.parse(str);
        // const retrievedTypedArray = new Uint8Array(retrievedArr);
    } else {
        alert("فایلی یافت نشد");
    }
}

function addHover(h) {
    $(h).addClass("drop-zone-hover");
    $("#boxDrop img").addClass("img-hover");
}

function removeHover(h) {
    $(h).removeClass("drop-zone-hover");
    $("#boxDrop img").removeClass("img-hover");
}

function CancelUpload(force) {
    if (force === true || confirm("آیا عملیات لغو گردد؟") == true) {
        $(".file-title").html("Canceled");
        $("#boxUpload").hide();
        $(".waiting").hide();
        var req = db
            .transaction([storeName], "readonly")
            .objectStore(storeName)
            .getAll();
        req.onsuccess = function (params) {
            params.target.result.map((item) => {
                deleteRow(item.Id);
            });
        };
        $("#fileSelect").val("");
    }
}

function bytesToSize(bytes) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "n/a";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return `${bytes} ${sizes[i]})`;
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
}

function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function getFileImageType(str) {
    var splited = str.split(".");
    return `/images/${splited[splited.length - 1]}.png`;
}

if (!indexedDB) {
    alert("مرورگر شما از این برنامه پشتیبانی نمی‌کند");
} else {
    request = indexedDB.open(baseName, 1);
    request.onerror = function (event) {
        console.log("خطای دیتابیس ", event);
    };
    request.onupgradeneeded = function (event) {
        console.log("در حال بروزرسانی ...");
        db = event.target.result;
        var objectStore = db.createObjectStore(storeName, {
            keyPath: storeId,
            autoIncrement: true,
        });
    };
    request.onsuccess = function (event) {
        console.log("عملیات پایان یافت");
        db = event.target.result;
    };
}

function addRow(obj) {
    var transaction = db.transaction([storeName], "readwrite");
    var objectStore = transaction.objectStore(storeName);
    objectStore.add(obj);
    transaction.onerror = function (event) {
        alert("مشکلی پیش آمد، مجدد تلاش فرمائید");
    };
}

function getRow(rowId) {
    var id = parseInt(rowId);
    var request = db
        .transaction([storeName], "readonly")
        .objectStore(storeName)
        .get(id);
    request.onsuccess = function (event) {
        var r = request.result;
        if (r != null) {
            // r.obj
        } else {
            alert("این رکورد موجود نیست");
        }
    };
}

function updateRow(rowId, obj) {
    deleteRow(rowId);
    addRow(obj);
    //var rollNo = parseInt(rowId);
    //var transaction = db.transaction([storeName], "readwrite");
    //var objectStore = transaction.objectStore(storeName);
    //var request = objectStore.get(rollNo);
    //request.onsuccess = function (event) {
    //    request.result = obj;
    //    objectStore.put(request.result);
    //    //alert("رکورد مورد نظر ویرایش شد!!!");
    //};
}

function deleteRow(rowId) {
    var id = parseInt(rowId);
    db.transaction([storeName], "readwrite").objectStore(storeName).delete(id);
}

function ToggleUpload(h, st) {
    //if (st == true) {
    //$(h).attr('onclick', 'ToggleUpload(this, false)');
    var req = db
        .transaction([storeName], "readonly")
        .objectStore(storeName)
        .getAll();
    req.onsuccess = function (params) {
        var row = params.target.result[0];
        var byteCount = 20000;
        if (row.fileBytes.length < byteCount)
            byteCount = row.fileBytes.length;
        var sendArray = row.fileBytes.slice(0, byteCount);
        row.isStarted = true;
        row.fileBytes = row.fileBytes.slice(byteCount);
        row.part += 1;
        var model = {
            FileId: row.fileId,
            FileName: row.fileName,
            FileSize: row.fileSize,
            FileBytes: sendArray.join(','),
            Part: row.part,
        };
        $.ajax({
            url: "/Home/UploadFile",
            method: 'POST',
            type: "POST",
            //contentType: 'application/json;',
            data: {
                file: model
            },
            success: function (res) {
                if (res === 1) {
                    updateRow(row.Id, row);
                    ToggleUpload(h, st);
                    var percent = Math.round((row.part / Math.round(row.fileSize / 20000)) * 100);
                    if (percent > 100)
                        percent = 100;
                    $('.percent').css('width', percent + '%');
                    $('#percent').html(percent + ' %');
                } else if (res === -1) {
                    setTimeout(ToggleUpload(h, st), 1500);
                } else {
                    if (row.fileBytes.length == 0) {
                        deleteRow(row.Id);
                        $('.percent').first().addClass('done');
                        setTimeout(function () {
                            $('.percent').first().removeClass('done');
                            $('.percent').css('width', '0%');
                            $('#percent').html('0 %');
                            CancelUpload(true);
                        }, 3000);
                    }
                }
            },
            error: function (err) {
            }
        });
    };
    //}
    //else {
    //    $(h).attr('onclick', 'ToggleUpload(this, true)');
    //}
}

function calculateSeconds(speed, speedUnit, size, sizeUnit) {
    var bytesSpeed = speedUnit * speed;
    var bytesSize = sizeUnit * size;
    return bytesSize / bytesSpeed
}
; function updateTime(size, speed) {
    var seconds = calculateSeconds(speed, speedUnit, size, sizeUnit);
    let ttime = "";
    if (isNaN(seconds) || seconds == null) {
        ttime = "پایان"
    } else if (seconds < 1) {
        ttime = "کمتر از یک ثانیه"
    } else {
        const d = Math.floor(seconds / (3600 * 24));
        seconds -= d * 3600 * 24;
        const h = Math.floor(seconds / 3600);
        seconds -= h * 3600;
        const m = Math.floor(seconds / 60);
        seconds -= m * 60;
        const tmp = [];
        (d) && tmp.push(d.toFixed(0) + ' روز,');
        (d || h) && tmp.push(h.toFixed(0) + ' ساعت,');
        (d || h || m) && tmp.push(m.toFixed(0) + ' دقیقه,');
        tmp.push(seconds.toFixed(0) + ' ثانیه.');
        ttime = tmp.join(' ')
    }
    return ttime;
}
