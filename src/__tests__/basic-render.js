import 'jest-dom/extend-expect'
import 'react-testing-library/cleanup-after-each'

import React from 'react'
import {format} from 'date-fns'
import toDate from 'date-fns/toDate'
import {render, fireEvent, getAllByTestId} from 'react-testing-library'

import {Formr} from '../formr'

test('renders initial values', () => {
  function App() {
    return (
      <Formr initialValues={{a: 'a', b: 'b', c: 'c'}}>
        {({values}) => <pre>{JSON.stringify(values)}</pre>}
      </Formr>
    )
  }
  const {getByText} = render(<App />)
  expect(getByText(/a*b*c/)).toBeInTheDOM()
})

test('handles input changes', () => {
  function App() {
    return (
      <Formr
        initialValues={{message: ''}}
        stateTransform={(prev, state) => {
          console.log({prev, state})
          return state
        }}
      >
        {({values, getInputProps}) => (
          <form>
            <div>
              <label htmlFor="message">Message input</label>
              <input
                type="text"
                data-testid="message"
                {...getInputProps({name: 'message'})}
              />
            </div>
          </form>
        )}
      </Formr>
    )
  }
  const {getByTestId} = render(<App />)

  const messageInput = getByTestId('message')
  expect(messageInput.textContent).toBe('')

  fireEvent.focus(messageInput)
  messageInput.value = 'hello'
  fireEvent.change(messageInput)
  fireEvent.blur(messageInput)
})

test('handles date values', () => {
  const y2k = new Date('2000-01-01 ')
  function App() {
    return (
      <Formr
        initialValues={{dateObj: format(y2k, 'YYYY-MM-dd')}}
        onSubmit={({values}) => {
          console.log({submitValues: values})
        }}
        stateTransform={(prev, state) => {
          // console.log({ prev, state })
          // const { values } = state
          // const dateObj = new Date(`${values.dateObj} `)
          // return {
          //   ...state,
          //   values: {
          //     ...values,
          //     dateObj,
          //   },
          // }
          return state
        }}
      >
        {({getInputProps}) => (
          <form>
            <div>
              <label htmlFor="date-obj">Date input</label>
              <input
                data-testid="date-obj"
                {...getInputProps({
                  name: 'dateObj',
                  type: 'date',
                })}
              />
            </div>
            <button data-testid="submit-button" type="submit">
              Submit
            </button>
          </form>
        )}
      </Formr>
    )
  }
  const {getByTestId} = render(<App />)

  const dateInput = getByTestId('date-obj')
  console.log({dateInput: dateInput.textContent})
  expect(dateInput).toBeInTheDOM()
  expect(dateInput.value).toBe('2000-01-01')

  dateInput.value = '2018-07-04'
  fireEvent.change(dateInput)
  fireEvent.blur(dateInput)
  expect(dateInput.value).toBe('2018-07-04')

  dateInput.value = '1984-10-29'
  fireEvent.change(dateInput)
  expect(dateInput.value).toBe('1984-10-29')
})
