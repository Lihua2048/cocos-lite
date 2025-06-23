jest.mock('react-native/Libraries/Utilities/Platform', () => ({
    OS: 'web',
    select:(styles: any) => styles.web || styles.default
})
);
