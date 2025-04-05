// Continuous monitoring using a more immediate approach
useEffect(() => {
  // Check if there are URL parameters for auto-starting
  if (typeof window !== 'undefined') {
    const queryParams = new URLSearchParams(window.location.search);
    const autostart = queryParams.get('autostart') === 'true';
    const emailParam = queryParams.get('email');
    const monitorCeloParam = queryParams.get('monitorCelo') === 'true';
    const monitorPolygonParam = queryParams.get('monitorPolygon') === 'true';
    
    // Apply parameters if autostart is enabled
    if (autostart && emailParam) {
      setEmail(emailParam);
      
      if (monitorCeloParam !== null) {
        setMonitorCelo(monitorCeloParam);
      }
      
      if (monitorPolygonParam !== null) {
        setMonitorPolygon(monitorPolygonParam);
      }
      
      // Set isListening to true to auto-start monitoring
      setIsListening(true);
    }
  }
  
  // Initial fetch to populate event sets
  const initialFetch = async () => {
    const polygonData = await fetchPolygonEvents();
    const celoData = await fetchCeloEvents();
    
    // Initialize our event tracking sets
    if (polygonData?.success && polygonData.events) {
      polygonData.events.forEach(event => {
        polygonEventHashesRef.current.add(createEventHash(event));
      });
    }
    
    if (celoData?.success && celoData.events) {
      celoData.events.forEach(event => {
        celoEventHashesRef.current.add(createEventHash(event));
      });
    }
  };
  
  initialFetch();
  
  // Set up continuous event checking
  let checkingInterval;
  const startEventChecking = () => {
    // We'll use a very short interval to make it feel continuous
    checkingInterval = setInterval(() => {
      if (isListening) {
        if (monitorPolygon) fetchPolygonEvents();
        if (monitorCelo) fetchCeloEvents();
      }
    }, 3000); // Check every 3 seconds, but don't show this to the user
  };
  
  startEventChecking();
  
  return () => {
    clearInterval(checkingInterval);
  };
}, [isListening, monitorPolygon, monitorCelo, email]); 