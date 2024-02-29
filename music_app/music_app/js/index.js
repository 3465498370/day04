$(function () {
    // 服务端歌曲列表接口地址
    const musicListAPI = 'http://home.softeem.xin:8088/music/listAll'
    let musics = []
    let currentIndex = 0
    let now = 0
    let total = 0
    let playing = false
    // 创建音频播放器
    const player = $('<audio>')
    // 选中指定类名的元素并绑定点击事件
    $('.btn-list').on('click', function () {
        // 显示歌曲列表
        $('#music-list-dialog').fadeIn(1000);
    })

    $('#btn-close').click(function () {
        $('#music-list-dialog').fadeOut(1000)
    })

    //ajax技术
    $.get(musicListAPI, function (data) {
        // 将从服务端获取的数据缓存到变量中
        musics = data
        $.each(musics, (i, e) => {
            $('#music-list').append(`<li data-index="${i}">${e.name}</li>`)
        })
    })

    // 为歌曲列表项绑定点击事件，实现歌曲播放
    // 事件委派
    $('#music-list').on('click', 'li', function () {
        // 在当前索引更改前，移除上一首歌曲列表项的激活状态
        $(`#music-list > li:eq(${currentIndex})`).removeClass('active');
        // 获取li元素上的索引
        currentIndex = $(this).data('index')
        // 获取需要播放的歌曲对象
        let m = musics[currentIndex]
        // 为播放器设置播放源
        player.prop('src', m.path)
        // 调用startPlay函数
        startPlay();
    })

    // 封装一个公共函数，实现歌曲播放信息状态同步显示
    function startPlay() {
        playing = true
        // 主动触发play函数
        player.trigger('play')
        // 实现唱片旋转
        $('.cover').addClass('playing');
        // 在头部显示歌曲名称
        $('.music-name').text(musics[currentIndex].name);
        // 播放按钮切换为暂停
        $('.btn-play-pause > i').removeClass('fa-play').addClass('fa-pause');
        // 列表中正在播放的歌曲高亮展示
        $(`#music-list > li:eq(${currentIndex})`).addClass('active');
        // 同步显示唱片封面图片和背景毛玻璃图片
        $('.cover-img,body-bg').prop('src', musics[currentIndex].ablumImg)
    }

    // 监听播放器的媒体第一帧加载
    player.on('loadeddata', function () {
        // 获取播放器当前播放歌曲的总时长
        total = this.duration
        $('.time-total').text(fmtTime(total))
    })

    // 监听播放器的当前播放时间的变化
    player.on('timeupdate', function () {
        now = this.currentTime
        $('.time-now').text(fmtTime(now))
        // 实时同步进度条
        $('.progress').css('width', `${now / total * 100}%`)
    })

    // 格式化时间
    function fmtTime(t) {
        // 基于提供的时间构建日期对象
        t = new Date(t * 1000);
        // 获取日期对象中的分钟值
        let m = t.getMinutes()
        // 获取日期对象中的秒钟值
        let s = t.getSeconds()
        m = m < 10 ? `0${m}` : m
        s = s < 10 ? `0${s}` : s
        return `${m}:${s}`;
    }

    // 为进度条父容器设置点击事件
    $('.box-progress').on('click', function (e) {
        // 获取当前点击位置和左侧偏移值
        let offset = e.offsetX - 10
        // 当前进度条容器总宽度
        let width = $(this).width()
        // 计算获取当前播放器需要跳转的位置
        now = offset / width * total
        // 设置播放器的当前位置
        player.prop('currentTime', now)

    })

    // 播放和暂停实现
    $('.btn-play-pause').on('click', function () {
        if (playing) {
            // 暂停
            player.trigger('pause')
            $('.cover').removeClass('playing');
            $('.btn-play-pause > i').removeClass('fa-pause').addClass('fa-play');
            // 标记暂停
            playing = false
        } else {
            // 继续播放
            startPlay()
        }
    })

    // 点击按钮实现循环图标切换（列表，随机，单曲循环）
    // 根据循环状态实现上一曲和下一曲切歌
    // 歌曲播放完毕之后，自动切歌（参考循环方式）
    // 定义循环模式的枚举
    const PlayMode = {
        LIST_LOOP: 0,
        RANDOM: 1,
        SINGLE_LOOP: 2
    };

    // 默认循环模式为列表循环
    let playMode = PlayMode.LIST_LOOP;

    // 点击按钮实现循环图标切换
    $('.btn-loop').on('click', function () {
        // 切换循环模式
        playMode = (playMode + 1) % 3;
        // 根据循环模式设置按钮图标
        switch (playMode) {
            case PlayMode.LIST_LOOP:
                $(this).find('i').removeClass('fa-random').removeClass('fa-repeat').addClass('fa-list');
                break;
            case PlayMode.RANDOM:
                $(this).find('i').removeClass('fa-list').removeClass('fa-repeat').addClass('fa-random');
                break;
            case PlayMode.SINGLE_LOOP:
                $(this).find('i').removeClass('fa-list').removeClass('fa-random').addClass('fa-repeat');
                break;
        }
    });

    // 实现上一曲和下一曲切歌
    $('.btn-prev').on('click', function () {
        switch (playMode) {
            case PlayMode.LIST_LOOP:
                currentIndex = (currentIndex - 1 + musics.length) % musics.length;
                break;
            case PlayMode.RANDOM:
                currentIndex = Math.floor(Math.random() * musics.length);
                break;
            case PlayMode.SINGLE_LOOP:
                // 单曲循环时不改变当前索引
                break;
        }
        // 切换到上一曲
        switchSong();
    });

    $('.btn-next').on('click', function () {
        switch (playMode) {
            case PlayMode.LIST_LOOP:
                currentIndex = (currentIndex + 1) % musics.length;
                break;
            case PlayMode.RANDOM:
                currentIndex = Math.floor(Math.random() * musics.length);
                break;
            case PlayMode.SINGLE_LOOP:
                // 单曲循环时不改变当前索引
                break;
        }
        // 切换到下一曲
        switchSong();
    });

    // 切歌函数
    function switchSong() {
        // 移除上一首歌曲列表项的激活状态
        $(`#music-list > li:eq(${(currentIndex - 1 + musics.length) % musics.length})`).removeClass('active');
        // 为当前歌曲列表项添加激活状态
        $(`#music-list > li:eq(${currentIndex})`).addClass('active');
        // 获取当前歌曲对象
        let currentMusic = musics[currentIndex];
        // 为播放器设置当前播放歌曲的播放源
        player.prop('src', currentMusic.path);
        // 开始播放当前歌曲
        startPlay();
    }
    // 监听播放器的歌曲播放结束事件
    player.on('ended', function () {
        switch (playMode) {
            case PlayMode.LIST_LOOP:
                // 在列表循环模式下，播放下一曲
                currentIndex = (currentIndex + 1) % musics.length;
                break;
            case PlayMode.RANDOM:
                // 在随机播放模式下，随机播放一首歌曲
                currentIndex = Math.floor(Math.random() * musics.length);
                break;
            case PlayMode.SINGLE_LOOP:
                // 在单曲循环模式下，继续播放当前歌曲
                break;
        }
        // 切换到下一曲
        switchSong();
    });





})