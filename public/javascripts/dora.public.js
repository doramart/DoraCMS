/*
前后台公用js*/

$(function(){
    //用户注销
    $('#userLoginOut').click(function () {
        loginOut();
    });
});


function loginOut(){
    $.ajax({
        url: "/users/logout",
        method: "GET",
        success: function (result) {
            if (result === "success") {
                window.location = "/"
            } else {
                alert("未知异常，请稍后重试");
            }
        }
    })
}