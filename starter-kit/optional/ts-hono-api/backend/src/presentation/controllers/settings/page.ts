import { createPageController } from '../../helpers/pageController.js'

export const createSettingsPageController = () =>
  createPageController({
    template: 'settings/index',
    title: 'Settings',
    activePage: 'settings'
  })
