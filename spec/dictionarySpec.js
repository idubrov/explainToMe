describe("Dictionary", function() {

  it("decronymizeText", function() {
    var trie = buildTrie({"BFR": "Big Falcon Rocket"});
    expect(decronymizeText(trie, "Look, this is BFR flying!"))
      .toEqual([ "Look, this is ", {text: "BFR", title: "Big Falcon Rocket"}, " flying!" ]);
  });
});
