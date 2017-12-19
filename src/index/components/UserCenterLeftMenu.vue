<template>
  <div class="user-left-menu">
    <div class="user-logo" v-if="userInfo">
        <el-upload class="avatar-uploader" action="/system/upload?type=images" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload">
            <img v-if="userInfo.logo" :src="userInfo.logo" class="avatar">
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
        </el-upload>
        <span>{{userInfo.userName}}</span>
      </div>
      <ul class="user-menu-options">
        <li :class="{active : $route.fullPath == '/users/center'}" @click="getToUserPage('center')"><a><span class="fa fa-user"></span><span class="label">基本资料</span><i class="fa fa-angle-right"></i></a></li>
        <li :class="{active : $route.fullPath == '/users/password'}" @click="getToUserPage('password')"><a><span class="fa fa-asterisk"></span><span class="label">修改密码</span><i class="fa fa-angle-right"></i></a></li>
    </ul>
  </div>
</template>
<script>
export default {
  name: "user-left-menu",
  props: ["userInfo"],
  methods: {
    handleAvatarSuccess(res, file) {
      this.$emit("setNewlogo", res);
    },
    beforeAvatarUpload(file) {
      const isJPG = file.type === "image/jpeg";
      const isPNG = file.type === "image/png";
      const isGIF = file.type === "image/gif";
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isJPG && !isPNG && !isGIF) {
        this.$message.error("上传头像图片只能是 JPG,PNG,GIF 格式!");
      }
      if (!isLt2M) {
        this.$message.error("上传头像图片大小不能超过 2MB!");
      }
      return (isJPG || isPNG || isGIF) && isLt2M;
    },
    getToUserPage(page) {
      this.$router.push("/users/" + page);
    }
  }
};
</script>

<style lang="scss">

</style>

