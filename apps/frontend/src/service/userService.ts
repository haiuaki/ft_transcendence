const userService = {
    checkExistingUser: async (email:string, setLoading: any) => {
        setLoading(true);
     await new Promise<void>((resolve) => {
            setTimeout(resolve, 2000);
        });
setLoading(false)
    }
}

export default userService;