
import { useState, useMemo, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { scaleSequentialSqrt } from 'd3-scale';
import { interpolateYlOrRd } from 'd3-scale-chromatic';

const MyGlobe = () => {

    const [countries, setCountries] = useState({ features: []});
    const [hoverD, setHoverD] = useState();

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

    return <Globe
      globeImageUrl="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2UzZjJmYSIvPgo8L3N2Zz4="
      backgroundColor='#CCCCCC'
      lineHoverPrecision={0}

      polygonsData={countries.features.filter(d => d.properties.ISO_A2 !== 'AQ')}
      polygonCapColor={d => d === hoverD ? 'steelblue' : 'white'}
      polygonSideColor={() => "white" }
      polygonStrokeColor={ () => "#111111" }
      polygonLabel={({ properties: d }) => <div>
        <div><b>{d.ADMIN} ({d.ISO_A2})</b></div>
      </div>}
      onPolygonHover={setHoverD}
    />;
}

export default MyGlobe;