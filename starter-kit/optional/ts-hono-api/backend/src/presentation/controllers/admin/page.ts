import { createPageController } from '../../helpers/pageController.js'

export const createAdminPageController = () =>
  createPageController({
    template: 'admin/index',
    title: 'Admin Dashboard',
    activePage: 'admin'
  })
