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
  _meta = {}
  constructor(props) {
    super(props)
    const values = Object.entries(this.props.initialValues).reduce(
      (acc, [key, val]) => {
        if (Array.isArray(val)) {
          this._meta[key] = {
            _nextKey: 0, // monotonic
          }
          this._meta[key].getNextKey = () => {
            return this._meta[key]._nextKey++
          }
          val.forEach((v, i) => {
            acc[`${key}_${i}`] = {
              value: v,
              order: i,
              key: this._meta[key].getNextKey(),
            }
          })
        } else {
          acc[key] = val
        }
        return acc
      },
      {},
    )
    this.state = {
      _errors: {},
      _blurred: {},
      _focused: {},
      _isSubmitting: false,
      ...values,
    }
  }

  static getDerivedStateFromProps(props, state) {
    const toDelete = Object.entries(state).find(
      ([key, value]) => typeof value === 'undefined',
    )
    if (toDelete) {
      delete state[toDelete[0]]
      return state
    }
    return null
  }

  componentDidMount() {
    this._isMounted = true
  }
  componentWillUnmount() {
    this._isMounted = false
  }
  componentDidUpdate(prevProps, prevState) {
    console.log('compDidUPdate', { prevState, state: this.state })
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
      ({ _blurred }) => {
        return {
          _blurred: {
            ..._blurred,
            [field]: true,
          },
        }
      },
      () => console.log('set state callback BLUR'),
    )
  }
  handleFocus = ({ field, index }) => {
    console.log('handleFocus', field)
    this.setState(({ _focused }) => {
      return {
        _focused: {
          ..._focused,
          [field]: true,
        },
      }
    })
  }
  handleChange = e => {
    const { name, value } = e.target
    this.setState(prev => ({
      [name]: {
        ...prev[name],
        value,
      },
    }))
  }
  Input = ({ name, ...rest }) => {
    return (
      <input
        name={name}
        type="text"
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
        onChange={this.handleChange}
        value={this.state[name]}
        {...rest}
      />
    )
  }
  ArrayInput = ({ name, index, ...rest }) => {
    const indexifiedName = `${name}_${index}`
    const value = this.state[indexifiedName].value // {order, key, value}

    console.log({ indexifiedName, value })
    return (
      <input
        name={indexifiedName}
        type="text"
        onBlur={e => this.handleBlur({ field: name, index })}
        onFocus={e => this.handleFocus({ field: name, index })}
        onChange={this.handleChange}
        value={value}
        {...rest}
      />
    )
  }
  // getSortedArrayEntries = prefix => {
  //   const entries = Object.entries(this.state).filter(([key, val]) => key.startsWith(`${prefix}_`))
  //   entries.sort(([e1K, e1V], [e2K, e2V]) => e1V.order - e2V.order)
  // }

  // when do we actually need to sort..........?
  getSortedArrayValues = (prefix, state = this.state) => {
    const entries = Object.entries(state)
    const values = entries
      .filter(([key, _]) => key.startsWith(`${prefix}_`))
      .map(([_, val]) => val)
    values.sort((v1, v2) => v1.order - v2.order)
    return values
  }

  arrayInsert = (name, index) => {
    // spread all array items
    this.setState(prev => {
      // ...arrayState,

      const nextKey = this._meta[name].getNextKey()
      const values = this.getSortedArrayValues(name, prev)

      // insert new item into values array
      values.splice(index, 0, { value: '', key: nextKey }) // [ {order, key, value}, ...]

      // build and re-order based on current position
      return values.reduce((acc, value, index) => {
        acc[`${name}_${index}`] = { ...value, order: index }
        return acc
      }, {})
    })
  }
  arrayAdd = name => {
    // just adding new one at the end
    const nextKey = this._meta[name].getNextKey()
    const nextIndex = this.getSortedArrayValues(name).length

    this.setState(() => ({
      [`${name}_${nextIndex}`]: { value: '', order: nextIndex, key: nextKey },
    }))
  }
  arrayRemove = (name, key) => {
    this.setState(
      prev => {
        // all state prefixed keys need to be reset..

        // get all items, sorted
        const values = this.getSortedArrayValues(name, prev)

        // find one that has the key we're looking for
        const item = values.find(v => v.key === key)

        // removed based on that items order value
        // values.splice(item.order, 1) // [{order, key, value}, {order, key, value}, ...]

        // build and re-order items
        // const newState = Object.entries(prev).reduce((item, order) => {
        //   return {
        //     [`${name}_${order}`]: { ...item, order },
        //   }
        // }, {})
        return {
          [`${name}_${item.order}`]: undefined,
        }
      },
      () => {
        console.log('after arrayRemove:', { state: this.state })
      },
    )
  }
  getArray = prefix => {
    const values = this.getSortedArrayValues(prefix)
    const items = values.map((val, i) => ({
      ...val,
      order: i,
      name: `${prefix}_${i}`,
      actions: {
        insert: () => this.arrayInsert(prefix, val.order),
        remove: () => this.arrayRemove(prefix, val.key),
      },
    }))

    return items
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

    const {
      _errors: errors,
      _blurred: blurred,
      _focused: focused,
      _isSubmitting: isSubmitting,
      ...values
    } = this.state

    return children({
      errors,
      blurred,
      focused,
      isSubmitting,

      initialValues,
      values,

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
