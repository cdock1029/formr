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
  buildRefs = initialValues => {
    return Object.entries(initialValues).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value.map(() => React.createRef())
        return acc
      }
      acc[key] = React.createRef()
      return acc
    }, {})
  }
  state = {
    errors: {},
    blurred: {},
    focused: {},
    isSubmitting: false,
    internal: this.props.initialValues,
  }
  _refs = this.buildRefs(this.props.initialValues)

  componentDidMount() {
    // console.log({ cdmRefs: this._refs })
    this._isMounted = true
  }
  componentWillUnmount() {
    this._isMounted = false
  }
  componentDidUpdate(prevProps, prevState) {
    // console.log('compDidUPdate', { state: this.state })
  }
  handleSubmit = e => {
    if (e && e.preventDefault) {
      e.preventDefault()
      e.persist()
    }
    console.log({ _refs: this._refs })
    const values = Object.entries(this._refs).reduce((acc, [key, ref]) => {
      if (Array.isArray(ref)) {
        acc[key] = ref.map(r => r.current.value)
        return acc
      }
      acc[key] = ref.current.value
      return acc
    }, {})

    this.setState(
      () => ({
        isSubmitting: true,
      }),
      () => {
        this.props.onSubmit({ ...this.state, values })
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
  Input = ({ name, ...rest }) => {
    return (
      <input
        name={name}
        type="text"
        defaultValue={this.props.initialValues[name]}
        ref={this._refs[name]}
        onChange={e => {
          const { value } = e.target
          this.setState(({ internal }) => ({
            internal: {
              ...internal,
              [name]: value,
            },
          }))
        }}
        onBlur={e => this.handleBlur({ field: name })}
        onFocus={e => this.handleFocus({ field: name })}
        {...rest}
      />
    )
  }
  ArrayInput = ({ name, index, ...rest }) => {
    const value = this.props.initialValues[name][index]
    const refArray = this._refs[name]
    console.log({ name, refArray })
    return (
      <input
        name={`${name}[]`}
        type="text"
        defaultValue={value}
        ref={refArray[index]}
        onChange={e => {
          const { value } = e.target
          this.setState(({ internal }) => {
            const arr = internal[name]
            arr.splice(index, 1, value)
            return {
              internal: {
                ...internal,
                [name]: arr,
              },
            }
          })
        }}
        onBlur={e => this.handleBlur({ field: name, index })}
        onFocus={e => this.handleFocus({ field: name, index })}
        {...rest}
      />
    )
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
      Input: this.Input,
      ArrayInput: this.ArrayInput,
      actions: {
        handleSubmit: this.handleSubmit,
        arrayAdd: this.arrayAdd,
      },
    })
  }
}
