// 省市区数据（简化版）
export const regionData = [
  {
    value: '110000',
    label: '北京市',
    children: [
      {
        value: '110100',
        label: '北京市',
        children: [
          { value: '110101', label: '东城区' },
          { value: '110102', label: '西城区' },
          { value: '110105', label: '朝阳区' },
          { value: '110106', label: '丰台区' },
          { value: '110107', label: '石景山区' },
          { value: '110108', label: '海淀区' }
        ]
      }
    ]
  },
  {
    value: '120000',
    label: '天津市',
    children: [
      {
        value: '120100',
        label: '天津市',
        children: [
          { value: '120101', label: '和平区' },
          { value: '120102', label: '河东区' },
          { value: '120103', label: '河西区' },
          { value: '120104', label: '南开区' },
          { value: '120105', label: '河北区' }
        ]
      }
    ]
  },
  {
    value: '310000',
    label: '上海市',
    children: [
      {
        value: '310100',
        label: '上海市',
        children: [
          { value: '310101', label: '黄浦区' },
          { value: '310104', label: '徐汇区' },
          { value: '310105', label: '长宁区' },
          { value: '310106', label: '静安区' },
          { value: '310107', label: '普陀区' }
        ]
      }
    ]
  },
  {
    value: '440000',
    label: '广东省',
    children: [
      {
        value: '440100',
        label: '广州市',
        children: [
          { value: '440103', label: '荔湾区' },
          { value: '440104', label: '越秀区' },
          { value: '440105', label: '海珠区' },
          { value: '440106', label: '天河区' },
          { value: '440111', label: '白云区' }
        ]
      },
      {
        value: '440300',
        label: '深圳市',
        children: [
          { value: '440303', label: '罗湖区' },
          { value: '440304', label: '福田区' },
          { value: '440305', label: '南山区' },
          { value: '440306', label: '宝安区' },
          { value: '440307', label: '龙岗区' }
        ]
      }
    ]
  }
] 