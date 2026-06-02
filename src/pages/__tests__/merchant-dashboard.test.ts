import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MerchantDashboardPage from '../merchant/MerchantDashboardPage.vue'

const mocks = vi.hoisted(() => ({
  getMyMerchant: vi.fn(),
  listMenuItems: vi.fn(),
  createMenuItem: vi.fn(),
  updateMenuItem: vi.fn(),
  deleteMenuItem: vi.fn(),
  uploadMenuImage: vi.fn(),
  navigateTo: vi.fn(),
}))

vi.mock('../../api/merchants', () => ({
  getMyMerchant: mocks.getMyMerchant,
  listMenuItems: mocks.listMenuItems,
  createMenuItem: mocks.createMenuItem,
  updateMenuItem: mocks.updateMenuItem,
  deleteMenuItem: mocks.deleteMenuItem,
  uploadMenuImage: mocks.uploadMenuImage,
}))

vi.mock('../../router', () => ({
  navigateTo: mocks.navigateTo,
}))

const approvedMerchant = {
  id: 1,
  userId: 1,
  merchantName: '示範便當店',
  campus: '主校區',
  category: '便當',
  rating: 0,
  orderCount: 0,
  minOrder: 60,
  maxOrderQuantity: 20,
  deliveryTime: '30 分鐘',
  tags: ['熱門'],
  auditStatus: 1,
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
}

const imageUrl = 'https://storage.googleapis.com/kubereats-menu-images/1/abc.jpg'

beforeEach(() => {
  Object.values(mocks).forEach(fn => fn.mockReset())
  mocks.getMyMerchant.mockResolvedValue(approvedMerchant)
  mocks.listMenuItems.mockResolvedValue([])
})

async function openAddFormWithFile(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('[data-testid="merchant-add-menu-toggle"]').trigger('click')
  const input = wrapper.get('[data-testid="merchant-menu-image-input"]')
  const file = new File(['fake-bytes'], 'bento.jpg', { type: 'image/jpeg' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
  return file
}

describe('MerchantDashboardPage image upload', () => {
  it('uploads the selected image and fills imageUrl into the new-item form', async () => {
    mocks.uploadMenuImage.mockResolvedValue({ imageUrl })

    const wrapper = mount(MerchantDashboardPage)
    await flushPromises()

    const file = await openAddFormWithFile(wrapper)

    expect(mocks.uploadMenuImage).toHaveBeenCalledWith(file)
    const preview = wrapper.get('.add-form .image-preview')
    expect(preview.attributes('src')).toBe(imageUrl)
    expect(wrapper.get('.add-form .upload-btn').text()).toContain('更換圖片')
  })

  it('persists the uploaded imageUrl when creating the menu item', async () => {
    mocks.uploadMenuImage.mockResolvedValue({ imageUrl })
    mocks.createMenuItem.mockResolvedValue({
      id: 99,
      merchantId: 1,
      itemName: '幕之內便當',
      price: 135,
      maxDailyQuantity: 40,
      imageUrl,
      createdAt: '2026-06-02T00:00:00Z',
      updatedAt: '2026-06-02T00:00:00Z',
    })

    const wrapper = mount(MerchantDashboardPage)
    await flushPromises()
    await openAddFormWithFile(wrapper)

    await wrapper.get('[data-testid="merchant-menu-name-input"]').setValue('幕之內便當')
    await wrapper.get('[data-testid="merchant-menu-price-input"]').setValue('135')
    await wrapper.get('[data-testid="merchant-menu-capacity-input"]').setValue('40')
    await wrapper.get('[data-testid="merchant-menu-create-button"]').trigger('click')
    await flushPromises()

    expect(mocks.createMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({ itemName: '幕之內便當', imageUrl }),
    )
  })

  it('shows an error message when the image upload fails', async () => {
    mocks.uploadMenuImage.mockRejectedValue(new Error('圖片格式不支援'))

    const wrapper = mount(MerchantDashboardPage)
    await flushPromises()
    await openAddFormWithFile(wrapper)

    expect(wrapper.get('.error-text').text()).toContain('圖片格式不支援')
    expect(wrapper.find('.add-form .image-preview').exists()).toBe(false)
  })
})
