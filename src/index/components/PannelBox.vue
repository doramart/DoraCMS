<template>
    <div :class="'pannel-box ' + className">
        <h3 class="pannel-title">{{title}}</h3>
        <slot></slot>
        <div class="pannel-footer"></div>
    </div>
</template>
<script>
export default {
  name: "PannelBox",
  props: ["title", "className"]
};
</script>

<style lang="scss">

</style>