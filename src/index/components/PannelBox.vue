<template>
    <div :class="'pannel-box ' + className">
        <h3 class="pannel-title">{{title}}</h3>
        <slot></slot>
        <div class="pannel-footer"></div>
    </div>
</template>
<script>
    export default {
        name: 'PannelBox',
        props: ['title', 'className']
    }
</script>

<style lang="scss">
    .pannel-box {
        padding-bottom: 24px;
    }

    .pannel-title {
        font-size: 14px;
        color: #969696;
        font-weight: 400;
    }

    .pannel-footer {
        clear: both;
    }
</style>