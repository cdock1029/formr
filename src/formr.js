import React from 'react'

// mounting
// constructor    GDSFP       render              CDM

// updating
//                GDSFP  SCU? render (getSnapBU)  cDU

//                                                CWUnM

// GDSFP( props, state )

export class Formr extends React.Component {
  static defaultProps = {
    initialValues: {},
    onSubmit: () => {},
    // stateTransform: (prev, state) => state,
  }

  // static getDerivedStateFromProps(props, state) {
  //   // console.log('getDSFP', { state })
  //   const previousState = state.getPreviousState
  //     ? state.getPreviousState()
  //     : null
  //   const transformedState = previousState
  //     ? props.stateTransform(previousState, state)
  //     : state
  //   transformedState.getPreviousState = () => transformedState
  //   return transformedState
  // }

  _isMounted = false
  constructor(props) {
    super(props)
    this.state = {
      values: this.props.initialValues,

      fieldNames: Object.entries(this.props.initialValues).map(
        ([key, value]) => {
          console.log('entries:', { key, value })
          let finalKey = key
          if (Array.isArray(value)) {
            finalKey = `${key}[]`
          }
          return finalKey
        },
      ),
      errors: {},
      blurred: {},
      focused: {},

      isSubmitting: false,
    }
    // this.state.getPreviousState = props.prevStateGetterBuilder(this.state)
  }
  componentDidMount() {
    this._isMounted = true
  }
  componentWillUnmount() {
    this._isMounted = false
  }
  componentDidUpdate(prevProps, prevState) {
    console.log('compDidUPdate', { state: this.state })
  }
  handleSubmit = e => {
    if (e && e.preventDefault) {
      e.preventDefault()
      e.persist()
    }
    console.log({ fieldName: this.state.fieldNames })
    const elements = e.target.elements
    window.elements = elements
    const result = {}
    this.state.fieldNames.forEach(key => {
      console.log({ key })
      if (key.includes('[]')) {
        console.log('inside array build')
        result[key] = []
        elements[key].forEach(node => result[key].push(node.value))
      } else {
        result[key] = elements[key].value
      }
    })
    console.log({ elements, result })
    // console.table(mapped)
    this.setState(
      () => ({
        isSubmitting: true,
      }),
      () => {
        this.props.onSubmit({
          ...this.state,
          e,
        })
      },
    )
  }
  handleChange = ({ field, value, index }) => {
    console.log('handleChange')
    this.setState(
      ({ values }) => {
        let fieldValue = value
        if (index !== undefined) {
          fieldValue = values[field] || []
          fieldValue[index] = value
        }
        return {
          values: {
            ...values,
            [field]: fieldValue,
          },
        }
      },
      () => {
        console.log('set state callback CHANGED')
      },
    )
  }
  handleBlur = ({ field, index }) => {
    console.log('handleBlur', field)
    this.setState(
      ({ blurred }) => {
        let fieldValue = true
        if (index !== undefined) {
          fieldValue = blurred[field] || []
          fieldValue[index] = true
        }
        return {
          blurred: {
            ...blurred,
            [field]: fieldValue,
          },
        }
      },
      () => console.log('set state callback BLUR'),
    )
  }
  handleFocus = ({ field, index }) => {
    console.log('handleFocus', field)
    this.setState(({ focused }) => {
      let fieldValue = true
      if (index !== undefined) {
        fieldValue = focused[field] || []
        fieldValue[index] = true
      }
      return {
        focused: {
          ...focused,
          [field]: fieldValue,
        },
      }
    })
  }
  getValue = ({ field, index }) => {
    let value = this.props.initialValues[field]
    return value
  }
  getInputProps = ({ name, id, index, ...rest }) => {
    const field = name ? name : id
    const indexExists = typeof index !== 'undefined'
    return {
      id,
      name: indexExists ? `${name}[]` : name,
      type: 'text',
      // value: indexExists ? undefined : this.getValue({ field, index }),

      defaultValue: indexExists
        ? this.state.values[field][index]
        : this.props.initialValues[field],
      // defaultValue: indexExists ? this.state.initialValues[field][index] : this.state.initialValues[field],

      // onChange: indexExists
      //   ? undefined
      //   : e => this.handleChange({ field, value: e.target.value, index }),
      onBlur: e => this.handleBlur({ field, index }),
      onFocus: e => this.handleFocus({ field, index }),
      ...rest,
    }
  }
  arrayAdd = (field, newValue = '') => {
    this.setState(({ values }) => {
      const update = [...values[field], newValue]
      console.log({ update })
      return {
        values: {
          ...values,
          [field]: update,
        },
      }
    })
  }
  arrayRemove = () => {}
  render() {
    console.log('render')
    const { children, initialValues } = this.props
    return children({
      ...this.state,
      initialValues,
      getInputProps: this.getInputProps,
      actions: {
        handleSubmit: this.handleSubmit,
        arrayAdd: this.arrayAdd,
      },
    })
  }
}
