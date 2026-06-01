import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmptyState from '../EmptyState.vue'
import ErrorState from '../ErrorState.vue'
import LoadingState from '../LoadingState.vue'

describe('state components', () => {
  it('renders loading rows', () => {
    const wrapper = mount(LoadingState, {
      props: { rows: 2, label: '讀取商家中' },
    })

    expect(wrapper.attributes('aria-label')).toBe('讀取商家中')
    expect(wrapper.findAll('.loading-row')).toHaveLength(2)
  })

  it('renders empty state action', async () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '找不到資料',
        description: '請清除篩選',
        actionLabel: '清除',
      },
    })

    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('找不到資料')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('renders error retry and home actions', async () => {
    const wrapper = mount(ErrorState, {
      props: { message: '網路失敗', showHome: true },
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')

    expect(wrapper.text()).toContain('網路失敗')
    expect(wrapper.emitted('retry')).toHaveLength(1)
    expect(wrapper.emitted('home')).toHaveLength(1)
  })
})
