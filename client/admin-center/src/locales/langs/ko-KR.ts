const local: App.I18n.Schema = {
  system: {
    title: 'DoraCMS',
    updateTitle: '시스템 버전 업데이트 안내',
    updateContent: '새 버전의 시스템이 감지되었습니다. 지금 바로 새로고침하시겠습니까?',
    updateConfirm: '즉시 새로고침',
    updateCancel: '나중에'
  },
  common: {
    action: '작업',
    add: '추가',
    addSuccess: '추가 성공',
    backToHome: '홈으로 돌아가기',
    batchDelete: '일괄 삭제',
    cancel: '취소',
    close: '닫기',
    check: '확인',
    expandColumn: '열 펼치기',
    columnSetting: '열 설정',
    config: '설정',
    confirm: '확인',
    delete: '삭제',
    deleteSuccess: '삭제 성공',
    confirmDelete: '삭제하시겠습니까?',
    edit: '수정',
    warning: '경고',
    error: '오류',
    index: '순번',
    keywordSearch: '키워드를 입력해주세요',
    logout: '로그아웃',
    logoutConfirm: '로그아웃하시겠습니까?',
    lookForward: '준비 중입니다',
    modify: '수정',
    modifySuccess: '수정 성공',
    submitError: '제출 실패',
    modifyError: '수정 실패',
    noData: '데이터 없음',
    operate: '작업',
    pleaseCheckValue: '값이 유효한지 확인해주세요',
    refresh: '새로고침',
    reset: '초기화',
    search: '검색',
    switch: '전환',
    tip: '알림',
    trigger: '트리거',
    update: '업데이트',
    updateSuccess: '업데이트 성공',
    operateSuccess: '작업 성공',
    userCenter: '사용자 센터',
    uploadSuccess: '업로드 성공',
    uploadError: '업로드 실패',
    yesOrNo: {
      yes: '예',
      no: '아니오'
    },
    input: {
      placeholder: '입력해주세요'
    },
    validation: {
      confirmPasswordRequired: '비밀번호 확인을 입력해주세요',
      passwordNotMatch: '두 비밀번호가 일치하지 않습니다',
      phone: '올바른 전화번호를 입력해주세요',
      email: '올바른 이메일 주소를 입력해주세요'
    },
    searchPlaceholder: '검색 키워드를 입력해주세요',
    name: '이름',
    description: '설명',
    createdAt: '생성 시간',
    updatedAt: '수정 시간',
    required: '필수',
    contentTag: '콘텐츠 태그 관리',
    upload: '업로드',
    button: '버튼',
    browserNotSupport: '브라우저가 클립보드 API를 지원하지 않습니다',
    copySuccess: '복사 성공: ',
    pleaseInputContent: '복사할 내용을 입력해주세요'
  },
  request: {
    logout: '요청 실패 후 사용자 로그아웃',
    logoutMsg: '사용자 상태가 유효하지 않습니다. 다시 로그인해주세요',
    logoutWithModal: '요청 실패 후 모달을 표시하고 사용자를 로그아웃',
    logoutWithModalMsg: '사용자 상태가 유효하지 않습니다. 다시 로그인해주세요',
    refreshToken: '요청 토큰이 만료되어 토큰을 갱신합니다',
    tokenExpired: '요청 토큰이 만료되었습니다'
  },
  theme: {
    themeSchema: {
      title: '테마 스키마',
      light: '라이트',
      dark: '다크',
      auto: '시스템 설정 따르기'
    },
    grayscale: '그레이스케일',
    colourWeakness: '색약 모드',
    layoutMode: {
      title: '레이아웃 모드',
      vertical: '수직 메뉴 모드',
      horizontal: '수평 메뉴 모드',
      'vertical-mix': '수직 혼합 메뉴 모드',
      'horizontal-mix': '수평 혼합 메뉴 모드',
      reverseHorizontalMix: '1단계 메뉴와 하위 메뉴의 위치를 반전'
    },
    recommendColor: '추천 색상 알고리즘 적용',
    recommendColorDesc: '추천 색상 알고리즘 참고',
    themeColor: {
      title: '테마 색상',
      primary: '기본',
      info: '정보',
      success: '성공',
      warning: '경고',
      error: '오류',
      followPrimary: '기본 색상 따르기'
    },
    scrollMode: {
      title: '스크롤 모드',
      wrapper: '전체 래퍼',
      content: '콘텐츠'
    },
    page: {
      animate: '페이지 애니메이션',
      mode: {
        title: '페이지 애니메이션 모드',
        fade: '페이드',
        'fade-slide': '슬라이드',
        'fade-bottom': '페이드 줌',
        'fade-scale': '페이드 스케일',
        'zoom-fade': '줌 페이드',
        'zoom-out': '줌 아웃',
        none: '없음'
      }
    },
    fixedHeaderAndTab: '헤더 및 탭 고정',
    header: {
      height: '헤더 높이',
      breadcrumb: {
        visible: '브레드크럼 표시',
        showIcon: '브레드크럼 아이콘 표시'
      },
      multilingual: {
        visible: '다국어 버튼 표시'
      }
    },
    tab: {
      visible: '탭 표시',
      cache: '탭 바 정보 캐시',
      height: '탭 높이',
      mode: {
        title: '탭 모드',
        chrome: '크롬',
        button: '버튼'
      }
    },
    sider: {
      inverted: '사이드바 다크',
      width: '사이드바 너비',
      collapsedWidth: '사이드바 축소 너비',
      mixWidth: '혼합 사이드바 너비',
      mixCollapsedWidth: '혼합 사이드바 축소 너비',
      mixChildMenuWidth: '혼합 하위 메뉴 너비'
    },
    footer: {
      visible: '푸터 표시',
      fixed: '푸터 고정',
      height: '푸터 높이',
      right: '푸터 우측 정렬'
    },
    watermark: {
      visible: '전체 화면 워터마크 표시',
      text: '워터마크 텍스트'
    },
    themeDrawerTitle: '테마 설정',
    pageFunTitle: '페이지 기능',
    resetCacheStrategy: {
      title: '캐시 초기화 전략',
      close: '페이지 닫기',
      refresh: '페이지 새로고침'
    },
    configOperation: {
      copyConfig: '설정 복사',
      copySuccessMsg: '복사 성공, "src/theme/settings.ts"의 "themeSettings" 변수를 교체해주세요',
      resetConfig: '설정 초기화',
      resetSuccessMsg: '초기화 성공'
    }
  },
  route: {
    login: '로그인',
    403: '권한 없음',
    404: '페이지를 찾을 수 없음',
    500: '서버 오류',
    'iframe-page': '외부 페이지',
    home: '홈',
    document: '문서',
    document_content: '콘텐츠',
    document_project: '프로젝트 문서',
    'document_project-link': '프로젝트 문서(외부 링크)',
    document_vue: 'Vue 문서',
    document_vite: 'Vite 문서',
    document_unocss: 'UnoCSS 문서',
    document_naive: 'Naive UI 문서',
    document_antd: 'Ant Design Vue 문서',
    'document_element-plus': 'Element Plus 문서',
    document_alova: 'Alova 문서',
    'document_content-message': '콘텐츠 메시지',
    'remote-page': '원격 컴포넌트',
    'remote-page_demo1': '원격 데모1',
    'remote-page_ai-model-manage': 'AI 모델 관리',
    'remote-page_ai-content-publish': 'AI 콘텐츠 발행',
    'user-center': '사용자 센터',
    about: '소개',
    function: '시스템 기능',
    alova: 'Alova 예제',
    alova_request: 'Alova 요청',
    alova_user: '사용자 목록',
    alova_scenes: '시나리오 요청',
    function_tab: '탭',
    'function_multi-tab': '다중 탭',
    'function_hide-child': '하위 메뉴 숨기기',
    'function_hide-child_one': '하위 메뉴 숨기기',
    'function_hide-child_two': '두 번째',
    'function_hide-child_three': '세 번째',
    function_request: '요청',
    'function_toggle-auth': '권한 전환',
    'function_super-page': '슈퍼 관리자 전용',
    manage: '시스템 관리',
    manage_user: '사용자 관리',
    manage_ads: '광고 관리',
    'manage_user-detail': '사용자 상세',
    'document_content-tag': '콘텐츠 태그',
    manage_role: '역할 관리',
    manage_menu: '메뉴 관리',
    'multi-menu': '다중 메뉴',
    'multi-menu_first': '메뉴 1',
    'multi-menu_first_child': '메뉴 1 하위',
    'multi-menu_second': '메뉴 2',
    'multi-menu_second_child': '메뉴 2 하위',
    'multi-menu_second_child_home': '메뉴 2 하위 홈',
    exception: '예외',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500',
    plugin: '플러그인',
    plugin_copy: '복사',
    plugin_charts: '차트',
    plugin_charts_echarts: 'ECharts',
    plugin_charts_antv: 'AntV',
    plugin_charts_vchart: 'VChart',
    plugin_editor: '에디터',
    plugin_editor_markdown: '마크다운',
    plugin_icon: '아이콘',
    plugin_map: '지도',
    plugin_print: '인쇄',
    plugin_swiper: '스와이퍼',
    plugin_video: '비디오',
    plugin_barcode: '바코드',
    plugin_pinyin: '병음',
    plugin_excel: '엑셀',
    plugin_pdf: 'PDF 미리보기',
    plugin_gantt: '간트 차트',
    plugin_gantt_dhtmlx: 'dhtmlxGantt',
    plugin_gantt_vtable: 'VTableGantt',
    plugin_typeit: 'Typeit',
    plugin_tables: '테이블',
    plugin_tables_vtable: 'VTable',
    'document_content-category': '콘텐츠 카테고리',
    'manage_system-option-log': '시스템 운영 로그',

    'manage_system-config': '시스템 설정',
    'manage_upload-file': '파일 업로드',
    member: '회원 관리',
    'member_reg-user': '가입 회원',
    email: '이메일 관리',
    'email_mail-template': '메일 템플릿',
    extend: '확장 관리',
    'extend_template-config': '템플릿 설정',
    extend_plugin: '플러그인 관리'
  },
  page: {
    login: {
      common: {
        loginOrRegister: '로그인 / 회원가입',
        userNamePlaceholder: '아이디를 입력해주세요',
        phonePlaceholder: '전화번호를 입력해주세요',
        codePlaceholder: '인증번호를 입력해주세요',
        passwordPlaceholder: '비밀번호를 입력해주세요',
        confirmPasswordPlaceholder: '비밀번호를 다시 입력해주세요',
        codeLogin: '인증번호 로그인',
        confirm: '확인',
        back: '뒤로',
        validateSuccess: '인증 성공',
        loginSuccess: '로그인 성공',
        welcomeBack: '{userName}님, 다시 오신 것을 환영합니다!',
        imageCodePlaceholder: '인증번호를 입력해주세요',
        imageCode: '인증번호',
        imageCodeRequired: '인증번호를 입력해주세요'
      },
      pwdLogin: {
        title: '비밀번호 로그인',
        rememberMe: '로그인 유지',
        forgetPassword: '비밀번호를 잊으셨나요?',
        register: '회원가입',
        otherAccountLogin: '다른 계정으로 로그인',
        otherLoginMode: '다른 로그인 방식',
        superAdmin: '슈퍼 관리자',
        admin: '관리자',
        user: '사용자'
      },
      initAdmin: {
        alertTitle: '시스템 초기화',
        alertDesc: '관리자가 없습니다. 계속하려면 관리자를 생성해주세요.',
        button: '관리자 생성',
        title: '관리자 초기화',
        description: '시스템을 사용하기 전에 모든 권한을 가진 관리자 계정을 생성해주세요.',
        form: {
          userName: '아이디',
          nickName: '닉네임',
          email: '이메일',
          phone: '전화번호',
          password: '비밀번호',
          confirmPassword: '비밀번호 확인',
          gender: '성별',
          genderMale: '남성',
          genderFemale: '여성'
        },
        success: '관리자가 생성되었습니다. 새 계정으로 로그인해주세요.'
      },
      codeLogin: {
        title: '인증번호 로그인',
        getCode: '인증번호 받기',
        reGetCode: '{time}초 후 재전송',
        sendCodeSuccess: '인증번호가 전송되었습니다',
        imageCodePlaceholder: '이미지 인증번호를 입력해주세요'
      },
      register: {
        title: '회원가입',
        agreement: '아래 내용을 읽고 동의합니다',
        protocol: '《이용약관》',
        policy: '《개인정보처리방침》'
      },
      resetPwd: {
        title: '비밀번호 재설정'
      },
      bindWeChat: {
        title: '위챗 연동'
      }
    },
    about: {
      title: '소개',
      introduction: `SoybeanAdmin은 Vue3, Vite5, TypeScript, Pinia, UnoCSS 등 최신 프론트엔드 기술 스택을 기반으로 한 우아하고 강력한 관리자 템플릿입니다. 다양한 테마 설정과 컴포넌트를 내장하고 있으며, 엄격한 코드 규칙과 자동화된 파일 라우팅 시스템을 갖추고 있습니다. 또한 ApiFox 기반의 온라인 목(mock) 데이터 솔루션도 사용합니다. SoybeanAdmin은 추가 설정 없이 바로 사용 가능한 원스톱 관리자 솔루션을 제공하며, 최신 기술을 빠르게 학습하기 위한 좋은 사례이기도 합니다.`,
      projectInfo: {
        title: '프로젝트 정보',
        version: '버전',
        latestBuildTime: '최근 빌드 시간',
        githubLink: 'Github 링크',
        previewLink: '미리보기 링크'
      },
      prdDep: '운영 환경 의존성',
      devDep: '개발 환경 의존성'
    },
    home: {
      branchDesc:
        '개발 및 업데이트 병합의 편의를 위해 메인 브랜치의 코드를 간소화하여 홈 메뉴만 남기고 나머지 내용은 example 브랜치로 옮겨 관리하고 있습니다. 미리보기 주소는 example 브랜치의 내용을 표시합니다.',
      greeting: {
        morning: '좋은 아침입니다, {userName}님, 오늘도 활기찬 하루 보내세요!',
        afternoon: '좋은 오후입니다, {userName}님, 남은 하루도 힘내세요!',
        evening: '좋은 저녁입니다, {userName}님, 오늘 하루도 수고하셨습니다!',
        night: '늦은 시간이네요, {userName}님, 푹 쉬고 내일을 위해 재충전하세요!'
      },
      weatherDesc: '오늘은 흐리다가 맑음, 20℃ - 25℃!',
      projectCount: '프로젝트 수',
      todo: '할 일',
      message: '메시지',
      downloadCount: '다운로드 수',
      registerCount: '가입자 수',
      contentTotal: '전체 콘텐츠',
      pendingContent: '검토 대기 콘텐츠',
      pendingMessage: '처리 대기 메시지',
      todayNewContent: '오늘 신규 콘텐츠',
      messageTotal: '전체 메시지',
      publishedContent: '발행된 콘텐츠',
      draftContent: '임시저장 콘텐츠',
      contentPublish: '콘텐츠 발행량',
      contentDistribution: '콘텐츠 분포',
      headerDesc: '오늘 {todayCount}건 추가, 검토 대기 {pendingContents}건, 처리 대기 메시지 {pendingMessages}건입니다.',
      overviewLoadError: '워크스페이스 개요를 불러오지 못했습니다. 나중에 다시 시도해주세요',
      trendLoadError: '트렌드 데이터를 불러오지 못했습니다',
      healthLoadError: '시스템 상태를 불러오지 못했습니다',
      schedule: '일과 휴식 일정',
      study: '학습',
      work: '업무',
      rest: '휴식',
      entertainment: '오락',
      visitCount: '방문 수',
      turnover: '거래액',
      dealCount: '거래 건수',
      projectNews: {
        title: '프로젝트 소식',
        moreNews: '더 많은 소식',
        desc1: 'DoraCMS는 2021년 5월 28일 오픈소스 프로젝트 soybean-admin을 만들었습니다!',
        desc2: 'Yanbowe님이 soybean-admin에 다중 탭 바가 적응되지 않는 버그를 제보했습니다.',
        desc3: 'DoraCMS는 soybean-admin 배포를 위한 충분한 준비를 하고 있습니다!',
        desc4: 'DoraCMS는 soybean-admin의 프로젝트 문서를 열심히 작성 중입니다!',
        desc5: 'DoraCMS가 워크벤치 페이지 일부를 가볍게 작성했는데, 충분히 볼만합니다!'
      },
      creativity: '창의성'
    },
    function: {
      tab: {
        tabOperate: {
          title: '탭 작업',
          addTab: '탭 추가',
          addTabDesc: '소개 페이지로 이동',
          closeTab: '탭 닫기',
          closeCurrentTab: '현재 탭 닫기',
          closeAboutTab: '"소개" 탭 닫기',
          addMultiTab: '다중 탭 추가',
          addMultiTabDesc1: 'MultiTab 페이지로 이동',
          addMultiTabDesc2: 'MultiTab 페이지로 이동(쿼리 파라미터 포함)'
        },
        tabTitle: {
          title: '탭 제목',
          changeTitle: '제목 변경',
          change: '변경',
          resetTitle: '제목 초기화',
          reset: '초기화'
        }
      },
      multiTab: {
        routeParam: '라우트 파라미터',
        backTab: 'function_tab로 돌아가기'
      },
      toggleAuth: {
        toggleAccount: '계정 전환',
        authHook: '권한 훅 함수 `hasAuth`',
        superAdminVisible: '슈퍼 관리자만 표시',
        adminVisible: '관리자만 표시',
        adminOrUserVisible: '관리자와 사용자 표시'
      },
      request: {
        repeatedErrorOccurOnce: '중복 요청 오류 1회 발생',
        repeatedError: '중복 요청 오류',
        repeatedErrorMsg1: '사용자 정의 요청 오류 1',
        repeatedErrorMsg2: '사용자 정의 요청 오류 2'
      }
    },
    alova: {
      scenes: {
        captchaSend: '인증번호 전송',
        autoRequest: '자동 요청',
        visibilityRequestTips: '브라우저 창 전환 시 자동으로 요청합니다',
        pollingRequestTips: '3초마다 요청합니다',
        networkRequestTips: '네트워크 재연결 시 자동으로 요청합니다',
        refreshTime: '새로고침 시간',
        startRequest: '요청 시작',
        stopRequest: '요청 중지',
        requestCrossComponent: '컴포넌트 간 요청',
        triggerAllRequest: '모든 자동 요청 수동 트리거'
      }
    },
    manage: {
      common: {
        status: {
          enable: '활성화',
          disable: '비활성화'
        }
      },
      role: {
        title: '역할 목록',
        roleName: '역할 이름',
        roleCode: '역할 코드',
        roleStatus: '역할 상태',
        roleDesc: '역할 설명',
        menuAuth: '메뉴 권한',
        buttonAuth: '버튼 권한',
        form: {
          roleName: '역할 이름을 입력해주세요',
          roleCode: '역할 코드를 입력해주세요',
          roleStatus: '역할 상태를 선택해주세요',
          roleDesc: '역할 설명을 입력해주세요'
        },
        addRole: '역할 추가',
        editRole: '역할 수정'
      },
      user: {
        title: '사용자 목록',
        userName: '사용자 이름',
        userGender: '성별',
        nickName: '닉네임',
        userPhone: '전화번호',
        userEmail: '이메일',
        userStatus: '사용자 상태',
        userRole: '사용자 역할',
        userAvatar: '사용자 아바타',
        password: '사용자 비밀번호',
        confirmPassword: '비밀번호 확인',
        uploadSuccess: '업로드 성공',
        uploadFailed: '업로드 실패',
        imageTypeError: '아바타 이미지는 JPG/PNG/GIF/WEBP 형식이어야 합니다!',
        imageSizeError: '아바타 이미지 크기는 2MB를 초과할 수 없습니다!',
        form: {
          userName: '사용자 이름을 입력해주세요',
          userGender: '성별을 선택해주세요',
          nickName: '닉네임을 입력해주세요',
          userPhone: '전화번호를 입력해주세요',
          userEmail: '이메일을 입력해주세요',
          userStatus: '사용자 상태를 선택해주세요',
          userRole: '사용자 역할을 선택해주세요',
          userAvatar: '사용자 아바타를 업로드해주세요',
          password: '사용자 비밀번호를 선택해주세요',
          confirmPassword: '사용자 비밀번호를 확인해주세요'
        },
        addUser: '사용자 추가',
        editUser: '사용자 수정',
        gender: {
          male: '남성',
          female: '여성'
        }
      },
      menu: {
        home: '홈',
        title: '메뉴 목록',
        id: 'ID',
        parentId: '상위 ID',
        menuType: '메뉴 유형',
        menuName: '메뉴 이름',
        routeName: '라우트 이름',
        routePath: '라우트 경로',
        pathParam: '경로 파라미터',
        layout: '레이아웃 컴포넌트',
        page: '페이지 컴포넌트',
        i18nKey: 'I18n 키',
        icon: '아이콘',
        localIcon: '로컬 아이콘',
        iconTypeTitle: '아이콘 유형',
        order: '순서',
        constant: '상수',
        keepAlive: '캐시 유지',
        href: 'Href',
        hideInMenu: '메뉴에서 숨기기',
        activeMenu: '활성 메뉴',
        multiTab: '다중 탭',
        fixedIndexInTab: '탭 내 고정 인덱스',
        query: '쿼리 파라미터',
        button: '버튼',
        buttonDesc: '버튼 설명',
        buttonPermissionCode: '권한 식별자',
        buttonHttpMethod: 'HTTP 메서드',
        menuStatus: '메뉴 상태',
        form: {
          home: '홈을 선택해주세요',
          menuType: '메뉴 유형을 선택해주세요',
          menuName: '메뉴 이름을 입력해주세요',
          routeName: '라우트 이름을 입력해주세요',
          routePath: '라우트 경로를 입력해주세요',
          pathParam: '경로 파라미터를 입력해주세요',
          page: '페이지 컴포넌트를 선택해주세요',
          layout: '레이아웃 컴포넌트를 선택해주세요',
          i18nKey: 'i18n 키를 입력해주세요',
          icon: 'iconify 이름을 입력해주세요',
          localIcon: '로컬 아이콘 이름을 입력해주세요',
          order: '순서를 입력해주세요',
          keepAlive: '라우트 캐시 여부를 선택해주세요',
          href: 'href를 입력해주세요',
          hideInMenu: '메뉴 숨김 여부를 선택해주세요',
          activeMenu: '강조 표시할 메뉴의 라우트 이름을 선택해주세요',
          multiTab: '다중 탭 지원 여부를 선택해주세요',
          fixedInTab: '탭 고정 여부를 선택해주세요',
          fixedIndexInTab: '탭에 고정될 인덱스를 입력해주세요',
          queryKey: '라우트 파라미터 Key를 입력해주세요',
          queryValue: '라우트 파라미터 Value를 입력해주세요',
          button: '버튼 여부를 선택해주세요',
          buttonDesc: '버튼 설명을 입력해주세요',
          buttonApi: '버튼 API를 입력해주세요',
          buttonPermissionCode: '권한 식별자를 입력해주세요',
          buttonHttpMethod: 'HTTP 메서드를 선택해주세요',
          menuStatus: '메뉴 상태를 선택해주세요',
          buttonPermissionCodeDuplicate: '권한 식별자는 중복될 수 없습니다'
        },
        security: {
          apiFormatTip: 'API 형식: module/operation, 예: user/getList. 영문자와 숫자만 사용 가능하며 특수문자는 사용할 수 없습니다',
          apiValidation: {
            formatError: 'API 형식이 올바르지 않습니다. "module/operation" 형식이어야 합니다',
            tooLong: 'API 경로가 너무 깁니다. 100자를 초과할 수 없습니다',
            dangerousChars: 'API에 위험한 문자가 포함되어 있습니다. < > " \' & 공백 .. // 는 사용할 수 없습니다',
            operationFormatError: '작업 이름 형식이 올바르지 않습니다. 영문자와 숫자만 사용 가능하며 문자로 시작해야 합니다',
            dangerousOperation: '작업 이름이 금지되어 있습니다. 보안 위험이 있습니다',
            operationTooLong: '작업 이름이 너무 깁니다. 50자를 초과할 수 없습니다'
          },
          configErrors: 'API 설정 오류'
        },
        addMenu: '메뉴 추가',
        editMenu: '메뉴 수정',
        addChildMenu: '하위 메뉴 추가',
        type: {
          directory: '디렉토리',
          menu: '메뉴'
        },
        iconType: {
          iconify: 'Iconify 아이콘',
          local: '로컬 아이콘'
        }
      },
      systemOptionLog: {
        title: '시스템 운영 로그',
        type: '로그 유형',
        logs: '로그 내용',
        module: '모듈',
        action: '작업',
        user_name: '사용자 이름',
        user_type: '사용자 유형',
        ip_address: 'IP 주소',
        request_path: '요청 경로',
        request_method: '요청 메서드',
        response_status: '응답 상태',
        response_time: '응답 시간',
        severity: '심각도',
        environment: '환경',
        resource_type: '리소스 유형',
        resource_id: '리소스 ID',
        createdAt: '생성 시간',
        clearAll: '전체 로그 삭제',
        viewDetail: '상세 보기',
        logDetail: '로그 상세',
        basicInfo: '기본 정보',
        requestInfo: '요청 정보',
        responseInfo: '응답 정보',
        userInfo: '사용자 정보',
        operationInfo: '작업 정보',
        errorInfo: '오류 정보',
        additionalInfo: '추가 정보',
        old_value: '이전 값',
        new_value: '새 값',
        error_message: '오류 메시지',
        error_code: '오류 코드',
        error_stack: '오류 스택',
        trace_id: '추적 ID',
        session_id: '세션 ID',
        user_agent: '사용자 에이전트',
        client_platform: '클라이언트 플랫폼',
        client_version: '클라이언트 버전',
        request_params: '요청 파라미터',
        request_body: '요청 본문',
        request_query: '쿼리 파라미터',
        response_size: '응답 크기',
        is_handled: '처리 여부',
        tags: '태그',
        extra_data: '추가 데이터',
        typeOptions: {
          login: '로그인',
          logout: '로그아웃',
          exception: '예외',
          operation: '작업',
          access: '접근',
          error: '오류',
          warning: '경고',
          info: '정보',
          debug: '디버그'
        },
        userTypeOptions: {
          admin: '관리자',
          user: '사용자',
          guest: '게스트',
          system: '시스템'
        },
        severityOptions: {
          low: '낮음',
          medium: '보통',
          high: '높음',
          critical: '심각'
        },
        environmentOptions: {
          local: '로컬',
          development: '개발',
          staging: '스테이징',
          production: '운영'
        },
        form: {
          type: '로그 유형을 선택해주세요',
          module: '모듈 이름을 입력해주세요',
          action: '작업을 입력해주세요',
          user_name: '사용자 이름을 입력해주세요',
          user_type: '사용자 유형을 선택해주세요',
          severity: '심각도를 선택해주세요',
          environment: '환경을 선택해주세요',
          ip_address: 'IP 주소를 입력해주세요',
          start_date: '시작 날짜를 선택해주세요',
          end_date: '종료 날짜를 선택해주세요',
          keyword: '키워드를 입력해주세요'
        },
        startDate: '시작 날짜',
        endDate: '종료 날짜',
        dateRange: '날짜 범위',
        keyword: '키워드',
        stats: {
          title: '로그 통계',
          total: '전체 로그',
          today: '오늘 로그',
          byType: '유형별',
          bySeverity: '심각도별',
          byModule: '모듈별'
        },
        export: '로그 내보내기',
        exportSuccess: '내보내기 성공',
        exportFailed: '내보내기 실패'
      },

      systemConfig: {
        title: '시스템 설정',
        key: '설정 키',
        value: '설정 값',
        type: '유형',
        public: '공개 여부',
        addConfig: '설정 추가',
        editConfig: '설정 수정',
        form: {
          key: '설정 키를 입력해주세요',
          value: '설정 값을 입력해주세요',
          type: '설정 유형을 선택해주세요',
          public: '공개 여부를 선택해주세요'
        }
      },
      uploadFile: {
        title: '업로드 설정',
        type: '업로드 유형',
        local: '로컬',
        qiniu: 'Qiniu 클라우드',
        aliyun: 'Aliyun OSS',
        uploadPath: '업로드 경로',
        qn_bucket: 'Bucket',
        qn_accessKey: 'Access Key',
        qn_secretKey: 'Secret Key',
        qn_zone: 'Zone',
        qn_endPoint: 'Endpoint',
        oss_bucket: 'Bucket',
        oss_accessKey: 'Access Key',
        oss_secretKey: 'Secret Key',
        oss_region: 'Region',
        oss_endPoint: 'Endpoint',
        oss_apiVersion: 'API 버전',
        form: {
          uploadPath: '업로드 경로를 입력해주세요',
          qn_bucket: 'Bucket 이름을 입력해주세요',
          qn_accessKey: 'Access Key를 입력해주세요',
          qn_secretKey: 'Secret Key를 입력해주세요',
          qn_zone: 'Zone을 입력해주세요',
          qn_endPoint: 'Endpoint를 입력해주세요',
          oss_bucket: 'Bucket 이름을 입력해주세요',
          oss_accessKey: 'Access Key를 입력해주세요',
          oss_secretKey: 'Secret Key를 입력해주세요',
          oss_region: 'Region을 입력해주세요',
          oss_endPoint: 'Endpoint를 입력해주세요',
          oss_apiVersion: 'API 버전을 입력해주세요'
        }
      }
    },
    document: {
      ads: {
        title: '광고 관리',
        name: '이름',
        type: '유형',
        type_image: '이미지',
        type_text: '텍스트',
        state: '상태',
        carousel: '캐러셀',
        height: '높이',
        comments: '설명',
        items: '항목',
        item: '항목',
        link: '링크',
        alt: 'Alt',
        target: '타겟',
        image: '이미지',
        copyCode: '코드 복사',
        typeOptions: {
          image: '이미지',
          text: '텍스트'
        }
      },
      contentCategory: {
        title: '카테고리',
        add: '카테고리 추가',
        addSub: '하위 카테고리 추가',
        edit: '카테고리 수정',
        name: '카테고리 이름',
        parentName: '상위 카테고리',
        enable: '활성화',
        type: '카테고리 유형',
        typeNormal: '일반',
        typeSinger: '단일 페이지',
        icon: '카테고리 아이콘',
        cover: '카테고리 커버',
        template: '카테고리 템플릿',
        seoUrl: 'SEO URL',
        sort: '정렬',
        keywords: '키워드',
        description: '설명',
        nameRequired: '카테고리 이름은 필수입니다',
        nameLength: '카테고리 이름은 20자를 초과할 수 없습니다',
        seoUrlRequired: 'SEO URL은 필수입니다',
        descriptionRequired: '설명은 필수입니다',
        descriptionLength: '설명은 200자를 초과할 수 없습니다',
        imageTypeError: '이미지 형식이 올바르지 않습니다',
        imageSizeError: '이미지 크기는 2MB를 초과할 수 없습니다',
        form: {
          icon: '아이콘 이름을 입력해주세요'
        }
      },
      content: {
        title: '콘텐츠 관리',
        mainTitle: '제목',
        subTitle: '부제목',
        category: '카테고리',
        tags: '태그',
        type: '유형',
        author: '작성자',
        publishDate: '발행일',
        state: '상태',
        draft: '임시저장',
        clickNum: '조회수',
        commentNum: '댓글수',
        pendingReview: '검토 대기',
        approved: '승인됨',
        offline: '비공개',
        addContent: '콘텐츠 추가',
        editContent: '콘텐츠 수정',
        batchChangeCategory: '카테고리 일괄 변경',
        selectCover: '커버 선택',
        recyclebin: '휴지통',
        selectContentFirst: '콘텐츠를 먼저 선택해주세요',
        selectCoverFirst: '커버를 먼저 선택해주세요',
        selectCategory: '카테고리 선택',
        selectedContent: '선택한 콘텐츠',
        items: '개',
        keywords: '키워드',
        coverImage: '커버 이미지',
        uploadCover: '커버 업로드',
        description: '설명',
        content: '내용',
        comments: '댓글',
        source: '출처',
        isTop: '추천',
        isPinned: '고정',
        isPublished: '발행됨',
        hideForm: '폼 숨기기',
        batchRestore: '일괄 복원',
        restore: '복원',
        confirmRestore: '이 콘텐츠를 복원하시겠습니까?',
        operateSuccess: '작업 성공',
        form: {
          imageFormatError: 'jpeg, jpg, png, gif 형식의 이미지만 허용됩니다',
          imageSizeError: '이미지 크기는 2MB를 초과할 수 없습니다',
          contentPlaceholder: '내용을 입력해주세요...',
          keywordsSeparator: '여러 키워드는 쉼표로 구분해주세요'
        }
      },
      contentMessage: {
        title: '메시지 관리',
        userSaid: '사용자 메시지',
        content: '메시지 내용',
        author: '작성자',
        replyAuthor: '답장 대상',
        auditStatus: '심사 상태',
        praiseNum: '좋아요 수',
        despiseNum: '싫어요 수',
        createdAt: '메시지 시간',
        form: {
          searchContent: '메시지 내용을 입력해주세요',
          selectAuditStatus: '심사 상태를 선택해주세요'
        },
        reply: '답장',
        replyUser: '사용자 메시지에 답장',
        stitle: '게시글 제목',
        auditStatusOptions: {
          pending: '대기중',
          approved: '승인됨',
          rejected: '거부됨'
        }
      }
    },
    member: {
      regUser: {
        title: '가입 회원',
        userName: '사용자 이름',
        phone: '전화번호',
        email: '이메일',
        role: '역할',
        status: '상태',
        registerTime: '가입 시간',
        comments: '비고',
        editUser: '사용자 수정',
        normalUser: '일반 사용자',
        adminUser: '관리자'
      }
    },
    email: {
      mailTemplate: {
        title: '메일 템플릿 관리',
        type: '유형',
        comment: '비고',
        templateTitle: '제목',
        subTitle: '부제목',
        content: '내용',
        createdAt: '생성 시간',
        tags: '템플릿 태그',
        form: {
          type: '템플릿 유형을 선택해주세요',
          comment: '템플릿 비고를 입력해주세요',
          title: '템플릿 제목을 입력해주세요',
          subTitle: '템플릿 부제목을 입력해주세요',
          content: '템플릿 내용을 입력해주세요'
        },
        addTemplate: '템플릿 추가',
        editTemplate: '템플릿 수정',
        commonTags: '공통 태그',
        passwordRecoveryTags: '비밀번호 복구 태그',
        messageTags: '메시지 알림 태그',
        verificationTags: '이메일 인증 태그',
        tag: {
          siteName: '[사이트 이름]siteName',
          siteDomain: '[사이트 도메인]siteDomain',
          email: '[사용자 이메일]email',
          passwordToken: '[재설정 토큰]token',
          messageAuthor: '[메시지 작성자]message_author_userName',
          messageSendDate: '[메시지 시간]message_sendDate',
          messageContentTitle: '[관련 메시지 제목]message_content_title',
          messageContentId: '[관련 메시지 ID]message_content_id',
          verificationCode: '[인증번호]msgCode'
        }
      },
    },
    extend: {
      templateConfig: {
        title: '템플릿 설정',
        templateMarket: '템플릿 마켓',
        installedTemplates: '설치된 템플릿',
        uploadTemplate: '템플릿 업로드',
        author: '작성자',
        version: '버전',
        introduction: '소개',
        price: '가격',
        free: '무료',
        action: '작업',
        install: '설치',
        preview: '미리보기',
        enable: '활성화',
        uninstall: '제거',
        update: '업데이트',
        currentTheme: '현재 테마',
        systemTemplate: '시스템 템플릿',
        templateConfig: '템플릿 설정',
        addTemplateItem: '템플릿 항목 추가',
        form: {
          name: '이름',
          alias: '별칭',
          template: '템플릿',
          comments: '비고',
          installSuccessMsg: '템플릿이 설치되었습니다',
          uninstallSuccessMsg: '템플릿이 제거되었습니다',
          enableSuccessMsg: '템플릿이 활성화되었습니다',
          updateSuccessMsg: '템플릿이 업데이트되었습니다',
          uploadSuccessMsg: '템플릿이 업로드되었습니다',
        uploadFailMsg: '템플릿 업로드에 실패했습니다',
        limitFileType: 'ZIP 파일만 허용됩니다',
        limitFileSize: '파일 크기는 10MB를 초과할 수 없습니다',
        operationInProgress: '작업 진행 중입니다. 잠시만 기다려주세요...',
        installInProgress: '템플릿을 설치하는 중입니다. 잠시만 기다려주세요...',
        updateInProgress: '템플릿을 업데이트하는 중입니다. 잠시만 기다려주세요...',
        enableInProgress: '템플릿을 활성화하는 중입니다. 잠시만 기다려주세요...',
        uninstallInProgress: '템플릿을 제거하는 중입니다. 잠시만 기다려주세요...',
        processing: '처리 중...'
      },
      downloadExample: '템플릿 예제 다운로드',
      paymentTitle: '알리페이 결제',
      selectTemplate: '템플릿을 선택해주세요',
      templateItems: '템플릿 항목'
    },
      plugin: {
        title: '플러그인 관리',
        installedTitle: '설치된 플러그인',
        shopTitle: '플러그인 스토어',
        name: '이름',
        description: '설명',
        version: '버전',
        hooks: '훅',
        amount: '가격',
        state: '상태',
        install: '설치',
        uninstall: '제거',
        update: '업데이트',
        installed: '설치됨',
        notInstalled: '미설치',
        enable: '활성화',
        createdAt: '생성 시간',
        updatedAt: '수정 시간',
        free: '무료',
        installNotice: '이 플러그인을 설치하시겠습니까?',
        uninstallNotice: '이 플러그인을 제거하시겠습니까?',
        updateNotice: '이 플러그인을 업데이트하시겠습니까?',
        buyConfirm: '이 플러그인을 구매하시겠습니까?',
        scanToPay: '스캔하여 결제',
        pluginDetail: '플러그인 상세',
        form: {
          name: '플러그인 이름을 입력해주세요',
          description: '플러그인 설명을 입력해주세요'
        }
      }
    }
  },
  form: {
    required: '비워둘 수 없습니다',
    userName: {
      required: '사용자 이름을 입력해주세요',
      invalid: '사용자 이름 형식이 올바르지 않습니다'
    },
    phone: {
      required: '전화번호를 입력해주세요',
      invalid: '전화번호 형식이 올바르지 않습니다'
    },
    pwd: {
      required: '비밀번호를 입력해주세요',
      invalid: '영문, 숫자, 밑줄을 포함한 6~18자'
    },
    confirmPwd: {
      required: '비밀번호를 다시 입력해주세요',
      invalid: '두 비밀번호가 일치하지 않습니다'
    },
    code: {
      required: '인증번호를 입력해주세요',
      invalid: '인증번호 형식이 올바르지 않습니다'
    },
    email: {
      required: '이메일을 입력해주세요',
      invalid: '이메일 형식이 올바르지 않습니다'
    }
  },
  dropdown: {
    closeCurrent: '현재 탭 닫기',
    closeOther: '다른 탭 닫기',
    closeLeft: '왼쪽 탭 닫기',
    closeRight: '오른쪽 탭 닫기',
    closeAll: '모든 탭 닫기'
  },
  icon: {
    themeConfig: '테마 설정',
    themeSchema: '테마 스키마',
    lang: '언어 전환',
    fullscreen: '전체 화면',
    fullscreenExit: '전체 화면 종료',
    reload: '페이지 새로고침',
    collapse: '메뉴 축소',
    expand: '메뉴 확장',
    pin: '고정',
    unpin: '고정 해제',
    searchIcon: '아이콘 검색',
    clickToSelectIcon: '클릭하여 아이콘 선택',
    noResultFound: '검색 결과가 없습니다'
  },
  datatable: {
    itemCount: '총 {total}개'
  },
  component: {
    iconSelect: {
      searchPlaceholder: '아이콘 검색',
      selectPlaceholder: '클릭하여 아이콘 선택',
      noResult: '검색 결과가 없습니다'
    },
    coverSelect: {
      searchPlaceholder: '커버 검색',
      selectTypePlaceholder: '유형 선택',
      nameLabel: '이름',
      typeLabel: '유형',
      previewLabel: '미리보기',
      operateLabel: '작업',
      noImage: '이미지 없음',
      selected: '선택됨',
      select: '선택'
    }
  }
};

export default local;
