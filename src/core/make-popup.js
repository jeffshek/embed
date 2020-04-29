import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

import {
  appendParamsToUrl,
  replaceExistingKeys,
  ensureMetaViewport,
  noop
} from './utils'
import randomString from './utils/random-string'
import {
  isMobile,
  isScreenBig
} from './utils/mobile-detection'
import Popup, {
  POPUP,
  POPUP_MODES,
  DEFAULT_AUTOCLOSE_TIMEOUT
} from './views/popup'
import MobileModal from './views/mobile-modal'

const DEFAULT_DRAWER_WIDTH = 800

const defaultOptions = {
  mode: POPUP,
  autoOpen: false,
  isModalOpen: false,
  autoClose: DEFAULT_AUTOCLOSE_TIMEOUT,
  hideFooter: false,
  hideHeaders: false,
  hideScrollbars: false,
  disableTracking: false,
  drawerWidth: DEFAULT_DRAWER_WIDTH,
  onSubmit: noop
}

const queryStringKeys = {
  embedType: 'typeform-embed',
  hideFooter: 'embed-hide-footer',
  hideHeaders: 'embed-hide-headers',
  disableTracking: 'disable-tracking'
}

const renderComponent = (url, domNode, options, onClose) => {
  const {
    autoClose,
    buttonText,
    embedId,
    isAutoCloseEnabled,
    onSubmit
  } = options

  const urlWithQueryString = appendParamsToUrl(
    url,
    replaceExistingKeys(options, queryStringKeys)
  )

  if (!isMobile(navigator.userAgent) && isScreenBig()) {
    render(
      <Popup
        embedId={embedId}
        onClose={onClose}
        options={options}
        url={urlWithQueryString}
      />,
      domNode
    )
  } else {
    ensureMetaViewport()
    render(
      <MobileModal
        autoClose={autoClose}
        buttonText={buttonText}
        embedId={embedId}
        isAutoCloseEnabled={isAutoCloseEnabled}
        onClose={onClose}
        onSubmit={onSubmit}
        open
        url={urlWithQueryString}
      />,
      domNode
    )
  }
}

export default function makePopup (url, options) {
  const embedId = randomString()

  options = {
    ...defaultOptions,
    ...options,
    isAutoCloseEnabled: options.autoClose !== undefined,
    embedType: POPUP_MODES[options.mode],
    embedId
  }

  if (!Number.isSafeInteger(options.drawerWidth)) {
    throw new Error(
      `Whoops! You provided an invalid 'drawerWidth' option: "${options.drawerWidth}". It must be a number.`
    )
  }

  const domNode = document.createElement('div')
  options.isContained = options.container !== undefined
  options.container = options.container || document.body
  options.container.appendChild(domNode)

  const popup = {
    open (event) {
      const { currentTarget } = event || {}
      const currentUrl = currentTarget && currentTarget.href ? currentTarget.href : url
      renderComponent(currentUrl, domNode, options, this.close)
    },
    close () {
      window.postMessage({ type: 'form-closed', embedId }, '*')
      unmountComponentAtNode(domNode)
    }
  }

  if (options.autoOpen) {
    popup.open()
  }

  return popup
}
