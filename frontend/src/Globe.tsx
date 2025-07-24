
import { useState, useMemo, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { scaleSequentialSqrt } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';

const MyGlobe = () => {

    const [countries, setCountries] = useState({ features: []});
    const [hoverD, setHoverD] = useState();
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0});

    useEffect(() => {
      const handleResize = () => {
        const globeContainer = document.getElementById('globe-container');
        const computedStyle = getComputedStyle(globeContainer);
        

        const elementHeight = globeContainer.clientHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom);
        const elementWidth = globeContainer.clientWidth - parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
        console.log(elementWidth, elementHeight);

        setWindowSize({ width: elementWidth, height: elementHeight });

      };
      window.addEventListener('resize', handleResize);
      handleResize();
    }, []);

    useEffect(() => {
      // load data
      fetch('/data/ne_110m_admin_0_countries.geojson').then(res => res.json()).then(setCountries);
    }, []);

    const colorScale = scaleSequentialSqrt(interpolateYlOrRd);

    // GDP per capita (avoiding countries with small pop)
    const getVal = feat => feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

    const maxVal = useMemo(
      () => Math.max(...countries.features.map(getVal)),
      [countries]
    );
    colorScale.domain([0, maxVal]);

    const globeBackgroundSvgSource = (`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
        <rect width="400" height="400" fill="#e3f2fa"/>
      </svg>
    `);

    const globeBackgroundImage = `data:image/svg+xml;base64,${btoa(globeBackgroundSvgSource)}`;


    return (
      <div id="globe-container" style={{ position: "relative", height: "100%", width: "100%" }}>
        <div style={{ height: "2rem", width: "100%", position: "absolute", zIndex: 1, backgroundImage: "linear-gradient(white, rgba(0, 0, 0, 0))" }}></div>
        <div style={{ position: "absolute" }}>
          <Globe
            width={windowSize.width}
            height={windowSize.height}
            globeImageUrl={globeBackgroundImage}
            backgroundColor='#FEFEFE'
            lineHoverPrecision={0}

            polygonsData={countries.features.filter(d => d.properties.ISO_A2 !== 'AQ')}
            polygonCapColor={d => d === hoverD ? 'steelblue' : 'white'}
            polygonSideColor={() => "#e3f2fa" }
            polygonStrokeColor={ () => "#111111" }
            polygonLabel={({ properties: d }) => <div>
              <div><b>{d.ADMIN} ({d.ISO_A2})</b></div>
            </div>}
            onPolygonHover={setHoverD}
          />
        </div>
        <div style={{ height: "2rem", width: "100%", position: "absolute", bottom: -1, zIndex: 1, backgroundImage: "linear-gradient(rgba(255, 255, 255, 0), white)" }}></div>
      </div>
    );
}

export default MyGlobe;