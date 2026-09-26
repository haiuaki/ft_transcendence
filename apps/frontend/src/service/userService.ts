const userService = {
    checkExistingUser: async (email:string, setLoading: any) => {
        setLoading(true);
        setLoading(false)
    },
    createUser: async (email:string, password:string, username: string, setLoading: any) => {
        setLoading(true);
        setLoading(false)
    }
}

export default userService;