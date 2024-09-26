describe('First Test Suite', () => {
  it("Launch web application", () => {
    cy.visit("https://thimipottery.com/");
  })
  it('Add numbers', () => {
    let sum = 2 + 2;
    expect(sum).to.equal(4);
  })
})