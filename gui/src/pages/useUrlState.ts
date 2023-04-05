
const url = new URL(window.location.href)
// initialUrlState is an object with the keys and values from the URL search query
const initialUrlState = Object.fromEntries(url.searchParams.entries())

const useUrlState = () => {
    const updateUrlState = (state: any) => {
        const url = new URL(window.location.href)
        Object.keys(state).forEach((key) => {
            url.searchParams.set(key, state[key])
        })
        // correct the url to remove url encoding
        url.search = decodeURIComponent(url.search)
        window.history.pushState({}, '', url.toString())
    }
    return {
        updateUrlState,
        initialUrlState
    }
}

export default useUrlState