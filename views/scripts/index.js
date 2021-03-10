var myXhr = null
$(function () {
    $("#upload-a").click(function () {
        $("#upload-modal-btn").click()
        return false
    })
    $("#upload-modal-btn").click(function () {
        console.log('clicked')
    })
    $("#sample-a").click(function () {
        return false
    })
    $('#upload-cancel').click(function (e) {
        if (myXhr) {
            myXhr.abort();
            myXhr = null;
            console.log("upload Canceled");
        }
        updateUploadPercentage(0)

        $("#exampleModal").modal('hide')
        return false;
    });

    $("#auto-suggestions").autocomplete({
        source: function (request, response) {
            $.ajax({
                url: "http://gd.geobytes.com/AutoCompleteCity",
                dataType: "jsonp",
                data: {
                    q: request.term
                },
                success: function (data) {
                    data.push("load more...")
                    response(data);
                }
            });
        },
        minLength: 3,
        select: function (event, ui) {
            console.log(ui.item ?
                "Selected: " + ui.item.label :
                "Nothing selected, input was " + this.value);
        },
    });


    $("#upload-btn").click(function () {

        var uploadFile = $("#upload-file")
        console.log(uploadFile)
        var file = uploadFile[0].files[0];
        var upload = new Upload(file);
        // maby check size or type here with upload.getSize() and upload.getType()
        console.log(upload.getName(), " ", upload.getType(), " ", upload.getSize())
        // execute upload
        upload.doUpload()

    })
})

// Uploader
var Upload = function (file) {
    this.file = file;
};

Upload.prototype.getType = function () {
    return this.file.type;
};
Upload.prototype.getSize = function () {
    return this.file.size;
};
Upload.prototype.getName = function () {
    return this.file.name;
};
Upload.prototype.doUpload = function () {
    var that = this;
    var formData = new FormData();

    // add assoc key values, this will be posts values
    formData.append("file", this.file, this.getName());
    formData.append("upload_file", true);

    $.ajax({
        type: "POST",
        url: "https://file.io",
        xhr: function () {
            myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) {
                myXhr.upload.addEventListener('progress', that.progressHandling, false);
            }
            return myXhr;
        },
        success: function (data) {
            // your callback here
            console.log('done: ', data)
            Swal.fire(
                'Good job!',
                'File upload successfully',
                'success'
            )
            $('#exampleModal').modal('hide');
            updateUploadPercentage(0)
        },
        error: function (error) {
            // handle error
            console.error(error)
        },
        async: true,
        data: formData,
        cache: false,
        contentType: false,
        processData: false,
        timeout: 60000
    });
};
Upload.prototype.progressHandling = function (event) {
    var percent = 0;
    var position = event.loaded || event.position;
    var total = event.total;
    if (event.lengthComputable) {
        percent = Math.ceil(position / total * 100);
    }
    updateUploadPercentage(percent)

};
function updateUploadPercentage(percent) {
    console.log(percent)
    $("#upload-progress").prop('style', `width:${percent}%`)
    $("#upload-progress").prop('aria-valuenow', `${percent}`)
    $("#upload-percentage").text(`${percent}%`)
}