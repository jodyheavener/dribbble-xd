const React = require('react')
const config = require('../../library/config')
const _ = require('../../library/utils')
const Header = require('../header/Header.jsx')
const CloseFooter = require('../common/CloseFooter.jsx')

const errorMessages = {
  notConnected() {
    return 'Whoops! It looks like you’re not connected to the internet.'
  },
  noSelection() {
    return `You’ll need to first select an ${_.toSentence(config.allowedNodeTypes)} from the Layers panel.`
  },
  multipleSelection() {
    return 'You’ve selected more than one Layer. Please select one and try again.'
  },
  badNodeType() {
    return `Sorry, we can’t currently export a ${this.props.node.constructor.name} layer. Please choose an ${_.toSentence(config.allowedNodeTypes)} from the Layers panel.`
  },
  tooSmall() {
    return `Your selection is ${this.props.node.width}px × ${this.props.node.height}px, which is too small. Dribbble requires Shots to be at least ${config.dimensionReqs.width}px × ${config.dimensionReqs.height}px.`
  }
}

module.exports = class ErrorModal extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <div id="errors">
        <Header type={this.props.type === 'notConnected' ? 'connection' : 'error'} />
        <p className="message">{errorMessages[this.props.type].call(this)}</p>
        <CloseFooter dialog={this.props.dialog} />
      </div>
    )
  }
}