import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuantityStepper from '../QuantityStepper.vue'

describe('QuantityStepper', () => {
  it('emits increment and decrement values', async () => {
    const wrapper = mount(QuantityStepper, {
      props: { modelValue: 2, min: 0, max: 5, label: '雞腿便當' },
    })

    await wrapper.get('[aria-label="雞腿便當增加"]').trigger('click')
    await wrapper.get('[aria-label="雞腿便當減少"]').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[3], [1]])
  })

  it('respects min max and disabled states', async () => {
    const minWrapper = mount(QuantityStepper, {
      props: { modelValue: 0, min: 0, max: 1 },
    })
    const maxWrapper = mount(QuantityStepper, {
      props: { modelValue: 1, min: 0, max: 1 },
    })
    const disabledWrapper = mount(QuantityStepper, {
      props: { modelValue: 1, disabled: true },
    })

    expect(minWrapper.get('[aria-label="數量減少"]').attributes('disabled')).toBeDefined()
    expect(maxWrapper.get('[aria-label="數量增加"]').attributes('disabled')).toBeDefined()
    expect(disabledWrapper.get('[aria-label="數量增加"]').attributes('disabled')).toBeDefined()
  })
})
