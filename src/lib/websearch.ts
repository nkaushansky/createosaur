interface SearchResult {
  title: string;
  url: string;
  text: string;
}

// Mock websearch function for demo - replace with actual web search API
export const websearch = async (query: string): Promise<SearchResult[]> => {
  // This is a demo implementation
  // In a real app, you would integrate with a web search API
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock responses for common dinosaur searches
  const mockResults: { [key: string]: SearchResult[] } = {
    "allosaurus": [{
      title: "Allosaurus - Wikipedia",
      url: "https://en.wikipedia.org/wiki/Allosaurus",
      text: "Allosaurus fragilis was a large carnivorous dinosaur from the Late Jurassic period. It was a bipedal predator with powerful legs, sharp teeth, and large claws. Known for being an apex predator and hunter."
    }],
    "therizinosaurus": [{
      title: "Therizinosaurus - Giant Clawed Dinosaur",
      url: "https://example.com/therizinosaurus",
      text: "Therizinosaurus cheloniformis was a massive herbivore from the Late Cretaceous period. Despite its enormous claws, it was a plant-eater. It had a long neck, massive size, and distinctive large claws used for stripping vegetation."
    }],
    "microraptor": [{
      title: "Microraptor - Four-Winged Dinosaur",
      url: "https://example.com/microraptor",
      text: "Microraptor zhaoianus was a small feathered dinosaur from the Early Cretaceous period. It had four wings and was capable of gliding flight. Known for its black feathers, small size, and arboreal lifestyle."
    }]
  };
  
  // Check if we have a mock result for this query
  const queryLower = query.toLowerCase();
  for (const [key, results] of Object.entries(mockResults)) {
    if (queryLower.includes(key)) {
      return results;
    }
  }
  
  // For unknown dinosaurs, return empty results
  return [];
};