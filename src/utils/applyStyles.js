import propAliases from '../const/propAliases'
import breakpoints, {
  getBreakpointsNames,
  getBreakpointFor,
} from '../const/breakpoints'

const breakpointsNames = getBreakpointsNames()
const behaviors = ['down', 'up', 'only']

export const parseResponsivePropName = (propName) => {
  const sanitizedPropName = propName.replace(/[A-Z]/g, (capitalLetter) => {
    return `-${capitalLetter}`.toLowerCase()
  })

  const splitPropName = sanitizedPropName.split('-')

  const res = splitPropName.reduce(
    (acc, part, index) => {
      if (breakpointsNames.includes(part)) {
        return Object.assign({}, acc, { mediaQuery: part })
      }

      if (behaviors.includes(part)) {
        return Object.assign({}, acc, { behavior: part })
      }

      const nextPropName =
        acc.propName + index > 0
          ? part.slice(0, 1).toUpperCase() + part.slice(1, part.length)
          : part

      return Object.assign({}, acc, { propName: nextPropName })
    },
    {
      propName: '',
      mediaQuery: null,
      behavior: 'up',
    },
  )

  return res
}

const getMediaQueryString = (mediaQuery, behavior) => {
  const breakpoint = getBreakpointFor(mediaQuery)

  if (behavior === 'only') {
    return `(min-width: ${breakpoint.from}px) and (max-width: ${
      breakpoint.to
    }px)`
  }

  if (behavior === 'down') {
    return `(max-width: ${breakpoint.to}px)`
  }

  return `(min-width: ${breakpoint.from}px)`
}

const applyCssProps = (props, propValue, mediaQuery, behavior) => {
  const propLinesArr = props.map((propName) => {
    return `${propName}:${propValue};`
  })

  let propsCss = propLinesArr.join('')

  if (mediaQuery) {
    const query = getMediaQueryString(mediaQuery, behavior)
    propsCss = `@media ${query} {${propsCss}}`
  }

  return propsCss
}

export default function applyStyles(pristineProps) {
  const stylesArr = Object.keys(pristineProps).reduce(
    (styles, originalPropName) => {
      let nextStyles = styles

      const { propName, mediaQuery, behavior } = parseResponsivePropName(
        originalPropName,
      )

      const aliasOptions = propAliases[propName]

      if (!aliasOptions) {
        return nextStyles
      }

      const { props, transformValue } = aliasOptions
      const propValue = pristineProps[originalPropName]
      const transformedPropValue = transformValue
        ? transformValue(propValue)
        : propValue

      const css = applyCssProps(
        props,
        transformedPropValue,
        mediaQuery,
        behavior,
      )

      return nextStyles.concat(css)
    },
    [],
  )

  return stylesArr.join(' ')
}
