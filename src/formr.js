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
  }
  _isMounted = false
  _refs = new Map()
  key = 0
  buildRefs = initialValues => {
    Object.entries(initialValues).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const mapForArr = new Map()
        value.forEach((_, index) => {
          mapForArr.set(index, { ref: React.createRef(), key: this.key++ })
        })
        this._refs.set(key, mapForArr)
      } else {
        this._refs.set(key, React.createRef())
      }
    })
    console.log({ constructorRefs: this._refs })
  }
  constructor(props) {
    super(props)
    this.state = {
      errors: {},
      blurred: {},
      focused: {},
      isSubmitting: false,
      initialValues: this.props.initialValues,
    }
    this.buildRefs(this.props.initialValues)
  }

  componentDidMount() {
    console.log({ cdmRefs: this._refs })
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
    const values = Array.from(this._refs.entries()).reduce(
      (acc, [key, ref]) => {
        if (ref instanceof Map) {
          acc[key] = Array.from(ref.values()).map(
            ({ key, ref: r }) => r.current && r.current.value,
          )
        } else {
          acc[key] = ref.current.value
        }
        return acc
      },
      {},
    )

    this.setState(
      () => ({
        isSubmitting: true,
      }),
      () => {
        this.props.onSubmit({ ...this.state, values })
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
    let value = this.state.initialValues[field]
    return value
  }
  getArray = field => {
    const refMap = this._refs.get(field) // order => {ref, key}
    const temp = Array.from(refMap.entries())

    temp.sort(([order1, e1], [order2, e2]) => order1 - order2)
    console.log({ temp })

    return temp.map(([order, { key }]) => {
      return {
        key,
        remove: () => this.arrayRemove(field, key, order),
        insert: () => this.arrayInsert(field, order),
      }
    })
  }
  Input = ({ name, ...rest }) => {
    return (
      <input
        name={name}
        type="text"
        defaultValue={this.state.initialValues[name]}
        ref={this._refs.get(name)}
        // onChange={e => {
        //   const { value } = e.target
        //   this.setState(({ values }) => ({
        //     values: {
        //       ...values,
        //       [name]: value,
        //     },
        //   }))
        // }}
        onBlur={e => this.handleBlur({ field: name })}
        onFocus={e => this.handleFocus({ field: name })}
        {...rest}
      />
    )
  }
  ArrayInput = ({ name, index, ...rest }) => {
    let value = this.state.initialValues[name][index]
    const refMap = this._refs.get(name)
    const { ref } = refMap.get(index)

    // if (ref && ref.current) {
    //   console.log('current exists:', ref.current)
    //   value = ref.current.value
    // }
    console.log({ index, value })
    return (
      <input
        name={`${name}[]`}
        type="text"
        defaultValue={value}
        ref={ref}
        onBlur={e => this.handleBlur({ field: name, index })}
        onFocus={e => this.handleFocus({ field: name, index })}
        {...rest}
      />
    )
  }

  arrayInsert = (name, index = null) => {
    const refMap = this._refs.get(name)

    const entries = Array.from(refMap.entries()) // order => {ref, key}
    entries.sort(([order1, e1], [order2, e2]) => order1 - order2)

    const values = entries.map(([order, val]) => val)

    const order = index !== null ? index : entries.length
    values.splice(order, 0, { ref: React.createRef(), key: this.key++ })

    refMap.clear()

    console.log({ values })
    values.forEach((val, index) => {
      refMap.set(index, val)
    })
    console.log('after insert:', { entries: Array.from(refMap.entries()) })
    // this.forceUpdate()

    this.setState(({ initialValues }) => {
      const arr = initialValues[name] ? initialValues[name] : []
      arr.splice(index !== null ? index : arr.length, 0, '')
      console.log({ arr, index })
      return {
        initialValues: {
          ...initialValues,
          [name]: arr,
        },
      }
    })
  }
  arrayAdd = name => this.arrayInsert(name)
  arrayRemove = (name, key, index) => {
    console.log('removing', { name, key, index })
    const refMap = this._refs.get(name)
    refMap.delete(index)

    const refEntries = Array.from(refMap.entries()) // order => {ref, key}
    refEntries.sort(([order1, e1], [order2, e2]) => order1 - order2)

    refMap.clear()

    refEntries.forEach(([_, val], index) => {
      refMap.set(index, val)
    })

    // this.forceUpdate(() => {})
    this.setState(({ initialValues }) => {
      const arr = initialValues[name]
      arr.splice(index, 1)
      return {
        initialValues: {
          ...initialValues,
          [name]: arr,
        },
      }
    })
  }
  render() {
    console.log('render')
    const { children, initialValues } = this.props
    const {
      handleSubmit,
      arrayAdd,
      arrayRemove,
      Input,
      ArrayInput,
      getArray,
    } = this
    return children({
      ...this.state,
      initialValues,
      Input,
      ArrayInput,
      getArray,
      actions: {
        handleSubmit,
        arrayAdd,
        arrayRemove,
      },
    })
  }
}
