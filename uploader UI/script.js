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
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileBytes: array,
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

function CancelUpload() {
  if (confirm("آیا عملیات لغو گردد؟") == true) {
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
  var rollNo = parseInt(rowId);
  var transaction = db.transaction([storeName], "readwrite");
  var objectStore = transaction.objectStore(storeName);
  var request = objectStore.get(rollNo);
  request.onsuccess = function (event) {
    request.result.Mobile = obj.Mobile;
    objectStore.put(request.result);
    alert("رکورد مورد نظر ویرایش شد!!!");
  };
}

function deleteRow(rowId) {
  var id = parseInt(rowId);
  db.transaction([storeName], "readwrite").objectStore(storeName).delete(id);
}
